import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async calculateFee(provinceCode?: string, wardCode?: string): Promise<number> {
    if (provinceCode && wardCode) {
      const exactMatch = await this.prisma.shippingRegion.findFirst({
        where: { provinceCode, wardCode },
        include: { rule: true }
      });
      if (exactMatch && exactMatch.rule.isActive) return Number(exactMatch.rule.fee);
    }
    
    if (provinceCode) {
      const provMatch = await this.prisma.shippingRegion.findFirst({
        where: { provinceCode, wardCode: null },
        include: { rule: true }
      });
      if (provMatch && provMatch.rule.isActive) return Number(provMatch.rule.fee);
    }

    const defaultRule = await this.prisma.shippingRule.findFirst({
      where: { isDefault: true, isActive: true }
    });
    
    if (defaultRule) return Number(defaultRule.fee);
    
    // Fallback to legacy setting if no default rule exists
    const legacySetting = await this.prisma.setting.findUnique({
      where: { key: 'SHIPPING_FEE' },
    });
    return legacySetting ? Number(legacySetting.value) || 0 : 30000;
  }

  async getRules() {
    const rules = await this.prisma.shippingRule.findMany({
      include: { regions: true },
      orderBy: { createdAt: 'desc' },
    });
    return rules.map((r) => ({
      ...r,
      fee: Number(r.fee),
    }));
  }

  async createRule(dto: { name: string; fee: number; isDefault?: boolean; isActive?: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.shippingRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      const rule = await tx.shippingRule.create({
        data: {
          name: dto.name,
          fee: dto.fee,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
        },
      });
      return { ...rule, fee: Number(rule.fee) };
    });
  }

  async updateRule(id: string, dto: { name?: string; fee?: number; isDefault?: boolean; isActive?: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.shippingRule.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      const rule = await tx.shippingRule.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.fee !== undefined && { fee: dto.fee }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
      return { ...rule, fee: Number(rule.fee) };
    });
  }

  async deleteRule(id: string) {
    const exists = await this.prisma.shippingRule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Rule not found');
    await this.prisma.shippingRule.delete({ where: { id } });
    return { success: true };
  }
}
