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

  async createRule(dto: {
    name: string;
    fee: number;
    isDefault?: boolean;
    isActive?: boolean;
    regions?: { provinceCode: string; provinceName: string; wardCode?: string; wardName?: string }[];
  }) {
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
          regions: dto.regions?.length ? {
            create: dto.regions.map(r => ({
              provinceCode: r.provinceCode,
              provinceName: r.provinceName,
              wardCode: r.wardCode || null,
              wardName: r.wardName || null,
            }))
          } : undefined
        },
        include: { regions: true }
      });
      return { ...rule, fee: Number(rule.fee) };
    });
  }

  async updateRule(
    id: string,
    dto: {
      name?: string;
      fee?: number;
      isDefault?: boolean;
      isActive?: boolean;
      regions?: { provinceCode: string; provinceName: string; wardCode?: string; wardName?: string }[];
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.shippingRule.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      if (dto.regions) {
        await tx.shippingRegion.deleteMany({ where: { ruleId: id } });
      }

      const rule = await tx.shippingRule.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.fee !== undefined && { fee: dto.fee }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.regions && {
            regions: {
              create: dto.regions.map(r => ({
                provinceCode: r.provinceCode,
                provinceName: r.provinceName,
                wardCode: r.wardCode || null,
                wardName: r.wardName || null,
              }))
            }
          })
        },
        include: { regions: true }
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

  async addRegion(ruleId: string, dto: { provinceCode: string; provinceName: string; wardCode?: string; wardName?: string }) {
    const rule = await this.prisma.shippingRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Rule not found');

    const region = await this.prisma.shippingRegion.create({
      data: {
        ruleId,
        provinceCode: dto.provinceCode,
        provinceName: dto.provinceName,
        wardCode: dto.wardCode || null,
        wardName: dto.wardName || null,
      },
    });
    return region;
  }

  async removeRegion(ruleId: string, regionId: string) {
    const region = await this.prisma.shippingRegion.findUnique({ where: { id: regionId } });
    if (!region || region.ruleId !== ruleId) throw new NotFoundException('Region not found in this rule');

    await this.prisma.shippingRegion.delete({ where: { id: regionId } });
    return { success: true };
  }
}
