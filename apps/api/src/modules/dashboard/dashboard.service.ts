import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalOrders,
      revenueAgg,
      totalProducts,
      totalUsers,
      pendingOrders,
      lowStockVariants,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.productVariant.findMany({
        where: { deletedAt: null, isActive: true },
        select: { stockAvailable: true, lowStockThreshold: true },
      }),
    ]);

    const lowStockCount = lowStockVariants.filter(
      (v) =>
        v.stockAvailable > 0 && v.stockAvailable <= v.lowStockThreshold,
    ).length;

    return {
      totalOrders,
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      totalProducts,
      totalUsers,
      pendingOrders,
      lowStockCount,
    };
  }

  async getRevenue(days: number = 7) {
    const safeDays = days === 30 ? 30 : 7;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (safeDays - 1));

    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: since },
      },
      select: { total: true, createdAt: true },
    });

    const byDay: Record<string, number> = {};
    for (let i = 0; i < safeDays; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (key in byDay) {
        byDay[key] += Number(order.total);
      }
    }

    return Object.entries(byDay).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }
}
