import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { slugify } from '../../common/utils/slugify';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function computeStockStatus(
  stockAvailable: number,
  lowStockThreshold: number,
): StockStatus {
  if (stockAvailable <= 0) return 'out_of_stock';
  if (stockAvailable <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Variant `attributes` is persisted as a JSON string (NVarChar(Max)). Parse it
 * back into an object so the API contract matches the client type
 * (Record<string, string> | null). Malformed/empty JSON degrades to null.
 */
export function parseVariantAttributes(
  attributes: string | null | undefined,
): Record<string, string> | null {
  if (!attributes) return null;
  try {
    const parsed = JSON.parse(attributes);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)] as const);
      return entries.length > 0 ? Object.fromEntries(entries) : null;
    }
    return null;
  } catch {
    return null;
  }
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductDto, isStaff = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(!isStaff && { isActive: true }),
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { shortDescription: { contains: query.search } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) where.basePrice.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.basePrice.lte = query.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    if (sortBy === 'price') {
      orderBy.basePrice = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          variants: {
            where: { deletedAt: null, isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              stockAvailable: true,
              lowStockThreshold: true,
              isDefault: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Public: replace exact stock with stockStatus
    const data = products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => {
        const { stockAvailable, lowStockThreshold, ...rest } = v;
        if (isStaff) {
          return v;
        }
        return {
          ...rest,
          stockStatus: computeStockStatus(stockAvailable, lowStockThreshold),
        };
      }),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string, isStaff = false) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(!isStaff && { isActive: true }),
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        specs: { orderBy: { sortOrder: 'asc' } },
        optionTypes: {
          include: { values: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { deletedAt: null, ...(!isStaff && { isActive: true }) },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    if (isStaff) {
      // Parse attributes JSON string → object for the client contract.
      return {
        ...product,
        variants: product.variants.map((v) => ({
          ...v,
          attributes: parseVariantAttributes(v.attributes),
        })),
      };
    }

    // Public: stockStatus only + parsed attributes
    return {
      ...product,
      variants: product.variants.map((v) => {
        const {
          stockTotal: _st,
          stockAvailable,
          lowStockThreshold,
          ...rest
        } = v;
        return {
          ...rest,
          attributes: parseVariantAttributes(rest.attributes),
          stockStatus: computeStockStatus(stockAvailable, lowStockThreshold),
        };
      }),
    };
  }

  async create(dto: CreateProductDto) {
    // Validate category & brand exist
    const [category, brand] = await Promise.all([
      this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      }),
      this.prisma.brand.findFirst({
        where: { id: dto.brandId, deletedAt: null },
      }),
    ]);
    if (!category) throw new BadRequestException('Category not found');
    if (!brand) throw new BadRequestException('Brand not found');

    const slug = await this.uniqueSlug(dto.name);
    const sku = await this.uniqueSku(slug);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: dto.name,
            slug,
            shortDescription: dto.shortDescription,
            description: dto.description,
            basePrice: dto.basePrice,
            salePrice: dto.salePrice,
            categoryId: dto.categoryId,
            brandId: dto.brandId,
            metaTitle: dto.metaTitle,
            metaDescription: dto.metaDescription,
            isFeatured: dto.isFeatured ?? false,
            specs: dto.specs
              ? {
                  create: dto.specs.map((s, i) => ({
                    group: s.group,
                    name: s.name,
                    value: s.value,
                    sortOrder: s.sortOrder ?? i,
                  })),
                }
              : undefined,
            // Auto-create default variant
            variants: {
              create: {
                sku,
                name: 'Default',
                isDefault: true,
                stockTotal: 0,
                stockAvailable: 0,
              },
            },
          },
          include: {
            variants: true,
            specs: true,
            brand: true,
            category: true,
          },
        });
        return product;
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Product slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!cat) throw new BadRequestException('Category not found');
    }
    if (dto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: dto.brandId, deletedAt: null },
      });
      if (!brand) throw new BadRequestException('Brand not found');
    }

    const data: Prisma.ProductUpdateInput = {
      shortDescription: dto.shortDescription,
      description: dto.description,
      basePrice: dto.basePrice,
      salePrice: dto.salePrice,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      isFeatured: dto.isFeatured,
      isActive: dto.isActive,
    };

    if (dto.name && dto.name !== existing.name) {
      data.name = dto.name;
      data.slug = await this.uniqueSlug(dto.name, id);
    }
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.brandId) {
      data.brand = { connect: { id: dto.brandId } };
    }

    // Replace specs if provided
    if (dto.specs) {
      await this.prisma.productSpec.deleteMany({ where: { productId: id } });
      data.specs = {
        create: dto.specs.map((s, i) => ({
          group: s.group,
          name: s.name,
          value: s.value,
          sortOrder: s.sortOrder ?? i,
        })),
      };
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        variants: { where: { deletedAt: null } },
        specs: true,
        brand: true,
        category: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Soft-delete product + its variants
    await this.prisma.productVariant.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    let base = slugify(name);
    if (!base) base = 'product';
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });
      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  private async uniqueSku(base: string): Promise<string> {
    let sku = `SKU-${base.toUpperCase().slice(0, 20)}`;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.productVariant.findFirst({
        where: { sku, deletedAt: null },
      });
      if (!existing) return sku;
      sku = `SKU-${base.toUpperCase().slice(0, 16)}-${counter++}`;
    }
  }
}
