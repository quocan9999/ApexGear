import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private webhookSecret: string;
  private bankAccount: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.webhookSecret = this.config.get<string>('SEPAY_WEBHOOK_SECRET', '');
    this.bankAccount = this.config.get<string>('SEPAY_BANK_ACCOUNT', '');
  }

  async getQrData(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        paymentMethod: PaymentMethod.SEPAY,
        status: OrderStatus.PENDING,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found or not a SePay order');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }
    if (!order.sepayRef) {
      throw new BadRequestException('Order has no SePay reference');
    }

    return {
      bankAccount: this.bankAccount,
      amount: Number(order.total),
      content: order.sepayRef,
      orderNumber: order.orderNumber,
      expiresAt: new Date(
        order.createdAt.getTime() + 10 * 60 * 1000,
      ).toISOString(),
    };
  }

  async handleWebhook(body: Record<string, unknown>, signature?: string) {
    if (this.webhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing signature');
      }
      const expectedSig = createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');
      const a = Buffer.from(expectedSig);
      const b = Buffer.from(signature);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    const content = body.content as string | undefined;
    const transferAmount = Number(body.transferAmount);
    if (!content) throw new BadRequestException('Missing content');

    const order = await this.prisma.order.findFirst({
      where: {
        sepayRef: content,
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      },
    });
    if (!order) {
      this.logger.warn(`No matching order for sepayRef: ${content}`);
      return { success: false, message: 'No matching order' };
    }

    if (Number.isNaN(transferAmount) || transferAmount < Number(order.total)) {
      this.logger.warn(
        `Insufficient payment: ${transferAmount} < ${order.total}`,
      );
      return { success: false, message: 'Insufficient amount' };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PAID, paidAt: new Date() },
    });

    this.logger.log(`Payment received for order ${order.orderNumber}`);

    this.eventEmitter.emit('order.paid', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return { success: true, orderNumber: order.orderNumber };
  }
}
