import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

interface NotificationsPrismaClient {
  adminNotification: {
    upsert: (...args: any[]) => Promise<any>;
    create: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any[]>;
    count: (...args: any[]) => Promise<number>;
    updateMany: (...args: any[]) => Promise<{ count: number }>;
  };
  lowStockAlertState: {
    findUnique: (...args: any[]) => Promise<any>;
    upsert: (...args: any[]) => Promise<any>;
  };
}

export const LOW_STOCK_THRESHOLD = 5;

export type NotificationType = 'NEW_ORDER' | 'LOW_STOCK';

export interface NotificationVariantSnapshot {
  id: string;
  sku: string;
  name: string;
  stockAvailable: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface NotificationOrderSnapshot {
  orderId: string;
  orderNumber: string;
  total: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async recordNewOrder(order: NotificationOrderSnapshot) {
    const prisma = this.prisma as unknown as NotificationsPrismaClient;
    const title = `Đơn hàng mới #${order.orderNumber}`;
    const body = `Tổng ${this.formatCurrency(order.total)}`;
    const notification = await prisma.adminNotification.upsert({
      where: { dedupeKey: `NEW_ORDER:${order.orderId}` },
      create: {
        dedupeKey: `NEW_ORDER:${order.orderId}`,
        type: 'NEW_ORDER',
        title,
        body,
        orderId: order.orderId,
      },
      update: { title, body },
    });

    this.eventEmitter.emit('admin.notification', notification);
    return notification;
  }

  async syncLowStockState(variant: NotificationVariantSnapshot) {
    const prisma = this.prisma as unknown as NotificationsPrismaClient;
    const isLowStock =
      variant.stockAvailable > 0 &&
      variant.stockAvailable <= LOW_STOCK_THRESHOLD;

    const state = await prisma.lowStockAlertState.findUnique({
      where: { variantId: variant.id },
    });

    if (!isLowStock) {
      if (state?.isActive) {
        return prisma.lowStockAlertState.upsert({
          where: { variantId: variant.id },
          create: {
            variantId: variant.id,
            isActive: false,
            lastNotifiedStock: null,
            notifiedAt: null,
            resolvedAt: new Date(),
          },
          update: {
            isActive: false,
            lastNotifiedStock: null,
            notifiedAt: null,
            resolvedAt: new Date(),
          },
        });
      }
      return null;
    }

    if (state?.isActive) {
      return state;
    }

    const notification = await prisma.adminNotification.create({
      data: {
        dedupeKey: `LOW_STOCK:${variant.id}:${variant.stockAvailable}:${Date.now()}`,
        type: 'LOW_STOCK',
        title: `Sắp hết hàng: ${variant.sku}`,
        body: `${variant.product.name} chỉ còn ${variant.stockAvailable} sản phẩm`,
        variantId: variant.id,
      },
    });

    await prisma.lowStockAlertState.upsert({
      where: { variantId: variant.id },
      create: {
        variantId: variant.id,
        isActive: true,
        lastNotifiedStock: variant.stockAvailable,
        notifiedAt: new Date(),
        resolvedAt: null,
      },
      update: {
        isActive: true,
        lastNotifiedStock: variant.stockAvailable,
        notifiedAt: new Date(),
        resolvedAt: null,
      },
    });

    this.eventEmitter.emit('admin.notification', notification);
    return notification;
  }

  async list(query: QueryNotificationsDto) {
    const prisma = this.prisma as unknown as NotificationsPrismaClient;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { body: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminNotification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  unreadCount() {
    const prisma = this.prisma as unknown as NotificationsPrismaClient;
    return prisma.adminNotification.count({
      where: { isRead: false },
    });
  }

  async markAllRead() {
    const prisma = this.prisma as unknown as NotificationsPrismaClient;
    const result = await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
