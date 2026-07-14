import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enums';

@Injectable()
export class PaymentTimeoutService {
  private readonly logger = new Logger(PaymentTimeoutService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/1 * * * *') // Every minute
  async handleSepayTimeout() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.SEPAY,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        createdAt: { lt: tenMinutesAgo },
      },
      include: { items: true },
    });

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: 'Payment timeout (10 minutes)',
          },
        });

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockAvailable: { increment: item.quantity } },
          });
        }
      });

      this.logger.log(
        `Auto-cancelled timed out SePay order: ${order.orderNumber}`,
      );
    }

    if (expiredOrders.length > 0) {
      this.logger.log(
        `Cancelled ${expiredOrders.length} timed out SePay orders`,
      );
    }
  }
}
