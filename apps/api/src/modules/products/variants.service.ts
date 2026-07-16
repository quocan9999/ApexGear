import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { computeStockStatus } from './products.service';
import { slugify } from '../../common/utils/slugify';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string, isStaff = false) {
    await this.ensureProduct(productId);

    const variants = await this.prisma.productVariant.findMany({
      where: {
        productId,
        deletedAt: null,
        ...(!isStaff && { isActive: true }),
      },
      orderBy: { displayOrder: 'asc' },
    });

    if (isStaff) return variants;

    return variants.map((v) => {
      const { stockTotal: _st, stockAvailable, lowStockThreshold, ...rest } = v;
      return {
        ...rest,
        stockStatus: computeStockStatus(stockAvailable, lowStockThreshold),
      };
    });
  }

  async create(productId: string, dto: CreateVariantDto) {
    await this.ensureProduct(productId);

    const sku = dto.sku || (await this.generateSku(productId, dto.name));

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.productVariant.updateMany({
        where: { productId, isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const stockTotal = dto.stockTotal ?? 0;
    const stockAvailable = dto.stockAvailable ?? stockTotal;

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku,
        price: dto.price,
        stockTotal,
        stockAvailable,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        attributes: dto.attributes
          ? JSON.stringify(dto.attributes)
          : undefined,
        isDefault: dto.isDefault ?? false,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  async update(productId: string, variantId: string, dto: UpdateVariantDto) {
    const variant = await this.findVariant(productId, variantId);

    if (dto.isDefault) {
      await this.prisma.productVariant.updateMany({
        where: {
          productId,
          isDefault: true,
          deletedAt: null,
          NOT: { id: variantId },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: dto.name,
        sku: dto.sku,
        price: dto.price,
        stockTotal: dto.stockTotal,
        stockAvailable: dto.stockAvailable,
        lowStockThreshold: dto.lowStockThreshold,
        attributes:
          dto.attributes !== undefined
            ? dto.attributes
              ? JSON.stringify(dto.attributes)
              : null
            : undefined,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        displayOrder: dto.displayOrder,
      },
    });
  }

  async remove(productId: string, variantId: string) {
    const variant = await this.findVariant(productId, variantId);

    if (variant.isDefault) {
      const otherCount = await this.prisma.productVariant.count({
        where: {
          productId,
          deletedAt: null,
          NOT: { id: variantId },
        },
      });
      if (otherCount === 0) {
        throw new BadRequestException(
          'Cannot delete the only default variant. Delete the product instead.',
        );
      }
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });
  }

  private async ensureProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product;
  }

  private async findVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, deletedAt: null },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }
    return variant;
  }

  private async generateSku(productId: string, name: string): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    const base = slugify(`${product?.slug || 'p'}-${name}`)
      .toUpperCase()
      .slice(0, 24);
    let sku = `SKU-${base}`;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.productVariant.findFirst({
        where: { sku, deletedAt: null },
      });
      if (!existing) return sku;
      sku = `SKU-${base.slice(0, 20)}-${counter++}`;
    }
  }
}
