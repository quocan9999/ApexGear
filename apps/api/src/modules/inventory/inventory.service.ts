import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async overview(query: QueryInventoryDto) {
    return this.listVariants(query);
  }

  async lowStock(query: QueryInventoryDto) {
    return this.listVariants(query, 'low');
  }

  async outOfStock(query: QueryInventoryDto) {
    return this.listVariants(query, 'out');
  }

  async findVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }
    return variant;
  }

  async adjustStock(variantId: string, dto: AdjustStockDto) {
    const variant = await this.findVariant(variantId);

    const newAvailable = variant.stockAvailable + dto.adjustment;
    const newTotal = variant.stockTotal + dto.adjustment;

    if (newAvailable < 0) {
      throw new BadRequestException(
        `Adjustment would make stockAvailable negative (current: ${variant.stockAvailable}, adjustment: ${dto.adjustment})`,
      );
    }
    if (newTotal < 0) {
      throw new BadRequestException(
        `Adjustment would make stockTotal negative (current: ${variant.stockTotal}, adjustment: ${dto.adjustment})`,
      );
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stockAvailable: newAvailable,
        stockTotal: newTotal,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  private async listVariants(
    query: QueryInventoryDto,
    filter?: 'low' | 'out',
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {
      deletedAt: null,
      product: { deletedAt: null },
    };

    if (filter === 'out') {
      where.stockAvailable = 0;
    }

    if (query.search) {
      where.OR = [
        { sku: { contains: query.search } },
        { name: { contains: query.search } },
        { product: { name: { contains: query.search } } },
      ];
    }

    // Low stock needs column-to-column compare (stockAvailable <= lowStockThreshold).
    // Fetch a wider page and filter in-app for Phase 1A correctness.
    if (filter === 'low') {
      const candidates = await this.prisma.productVariant.findMany({
        where: {
          ...where,
          stockAvailable: { gt: 0 },
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { stockAvailable: 'asc' },
      });

      const filtered = candidates.filter(
        (v) => v.stockAvailable <= v.lowStockThreshold,
      );
      const total = filtered.length;
      const pageItems = filtered.slice(skip, skip + limit);

      return {
        data: pageItems.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          stockTotal: v.stockTotal,
          stockAvailable: v.stockAvailable,
          lowStockThreshold: v.lowStockThreshold,
          product: v.product,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      };
    }

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { stockAvailable: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return {
      data: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        stockTotal: v.stockTotal,
        stockAvailable: v.stockAvailable,
        lowStockThreshold: v.lowStockThreshold,
        product: v.product,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
}
