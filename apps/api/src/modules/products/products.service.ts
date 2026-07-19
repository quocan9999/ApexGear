import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { slugify } from '../../common/utils/slugify';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function computeStockStatus(
  stockAvailable: number,
  lowStockThreshold: number,
): StockStatus {
  if (stockAvailable <= 0) return 'OUT_OF_STOCK';
  if (stockAvailable <= lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
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

    if (query.search) {
      // ----- FTS path: pre-filter ids via FREETEXT, then hydrate via Prisma -----
      // FREETEXT treats the term as a phrase; strip single quotes and percent
      // chars that don't belong in a free-text query.
      const term = query.search.replace(/['%]/g, ' ').trim();
      if (!term) {
        // Search string was only punctuation — fall back to the non-search path.
        return this.findAllNoSearch({ ...query, search: undefined }, isStaff);
      }

      const where = this.buildFtsWhereClauses(query, isStaff, term);
      const orderBy = this.buildFtsOrderBy(query.sortBy, query.sortOrder);

      const ftsRows = await this.prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT p.[id] FROM [dbo].[Product] p ${where} ${orderBy} OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`,
      );

      const totalRow = await this.prisma.$queryRaw<{ count: number }[]>(
        Prisma.sql`SELECT COUNT(*) AS [count] FROM [dbo].[Product] p ${where}`,
      );
      const total = Number(totalRow[0]?.count ?? 0);

      const ids = ftsRows.map((r) => r.id);
      if (ids.length === 0) {
        return {
          data: [],
          meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      }

      // Hydrate with the same include graph; re-apply Prisma filters on top of
      // `id: { in: ids }` so the contract holds even if a race between the raw
      // query and hydrate changes the candidate set. No orderBy — we re-sort
      // in JS to match FTS id order.
      const baseWhere = this.buildProductWhere(query, isStaff);
      const products = await this.prisma.product.findMany({
        where: { ...baseWhere, id: { in: ids } },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
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
      });
      const idOrder = new Map(ids.map((id, i) => [id, i]));
      products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

      const data = products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          const { stockAvailable, lowStockThreshold, ...rest } = v;
          if (isStaff) return v;
          return {
            ...rest,
            stockStatus: computeStockStatus(stockAvailable, lowStockThreshold),
          };
        }),
      }));

      return {
        data,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    // ----- Non-search path: unchanged -----
    return this.findAllNoSearch(query, isStaff);
  }

  private async findAllNoSearch(
    query: QueryProductDto,
    isStaff: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildProductWhere(query, isStaff);

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
          images: { where: { isPrimary: true }, take: 1 },
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

    const data = products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => {
        const { stockAvailable, lowStockThreshold, ...rest } = v;
        if (isStaff) return v;
        return {
          ...rest,
          stockStatus: computeStockStatus(stockAvailable, lowStockThreshold),
        };
      }),
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Build the Prisma WHERE input shared by `findAllNoSearch` and the FTS hydrate
   * step. Mirrors the filters that `buildFtsWhereClauses` applies in raw SQL so
   * both paths return the same candidate set.
   */
  private buildProductWhere(
    query: QueryProductDto,
    isStaff: boolean,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(!isStaff && { isActive: true }),
    };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) where.basePrice.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.basePrice.lte = query.maxPrice;
    }
    return where;
  }

  /**
   * Build the shared WHERE clause for the FTS id query and the FTS count query.
   * Always mirrors the Prisma filters (`deletedAt`, `isActive`, category, brand,
   * isFeatured, basePrice) so the FTS candidate set matches what `findAllNoSearch`
   * would return. All user inputs are bound via `${...}` placeholders in
   * `Prisma.sql` — no string concatenation.
   */
  private buildFtsWhereClauses(
    query: QueryProductDto,
    isStaff: boolean,
    term: string,
  ): Prisma.Sql {
    return Prisma.sql`
      WHERE FREETEXT((p.[name], p.[description]), ${term}, LANGUAGE 'Vietnamese')
        AND p.[deletedAt] IS NULL
        ${!isStaff ? Prisma.sql`AND p.[isActive] = 1` : Prisma.empty}
        ${query.categoryId ? Prisma.sql`AND p.[categoryId] = ${query.categoryId}` : Prisma.empty}
        ${query.brandId ? Prisma.sql`AND p.[brandId] = ${query.brandId}` : Prisma.empty}
        ${query.isFeatured !== undefined ? Prisma.sql`AND p.[isFeatured] = ${query.isFeatured ? 1 : 0}` : Prisma.empty}
        ${query.minPrice !== undefined ? Prisma.sql`AND p.[basePrice] >= ${query.minPrice}` : Prisma.empty}
        ${query.maxPrice !== undefined ? Prisma.sql`AND p.[basePrice] <= ${query.maxPrice}` : Prisma.empty}
    `;
  }

  /**
   * Build the ORDER BY for the FTS id query from a whitelist. The class-validator
   * `IsIn(['price', 'name', 'createdAt'])` and `IsIn(['asc', 'desc'])` decorators
   * on QueryProductDto already constrain inputs, but we re-whitelist here so the
   * raw SQL surface stays narrow even if validation changes.
   */
  private buildFtsOrderBy(
    sortBy: 'price' | 'name' | 'createdAt' | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ): Prisma.Sql {
    const column =
      sortBy === 'price'
        ? Prisma.raw('[basePrice]')
        : sortBy === 'name'
        ? Prisma.raw('[name]')
        : Prisma.raw('[createdAt]');
    const direction =
      sortOrder === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC');
    return Prisma.sql`ORDER BY p.${column} ${direction}`;
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

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
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
