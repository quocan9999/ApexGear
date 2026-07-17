import { Injectable } from '@nestjs/common';
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
}
