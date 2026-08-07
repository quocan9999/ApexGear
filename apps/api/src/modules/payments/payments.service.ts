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

export interface WebhookVerificationOptions {
  signature?: string;
  timestamp?: string;
  rawBody?: Buffer | string;
  authHeader?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private webhookSecret: string;
  private bankAccount: string;
  private bankId: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.webhookSecret = this.config.get<string>('SEPAY_WEBHOOK_SECRET', '');
    this.bankAccount = this.config.get<string>('SEPAY_BANK_ACCOUNT', '');
    this.bankId = this.config.get<string>('SEPAY_BANK_ID', 'MB');
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
    if (!this.bankAccount) {
      throw new BadRequestException('Bank account is not configured in environment variables');
    }

    return {
      bankAccount: this.bankAccount,
      bankId: this.bankId,
      amount: Number(order.total),
      content: order.sepayRef,
      orderNumber: order.orderNumber,
      expiresAt: new Date(
        order.createdAt.getTime() + 10 * 60 * 1000,
      ).toISOString(),
    };
  }

  async handleWebhook(
    body: Record<string, unknown>,
    options?: WebhookVerificationOptions | string,
  ) {
    const verificationOpts: WebhookVerificationOptions =
      typeof options === 'string' ? { signature: options } : options || {};

    const { signature, timestamp, rawBody, authHeader } = verificationOpts;

    // Verify authentication if SEPAY_WEBHOOK_SECRET is configured
    if (this.webhookSecret) {
      let isVerified = false;

      // 1. Check API Key header (Authorization: Apikey <KEY> or Bearer <KEY>)
      if (authHeader) {
        const token = authHeader.replace(/^(Apikey|ApiKey|Bearer)\s+/i, '').trim();
        if (token === this.webhookSecret) {
          isVerified = true;
        }
      }

      // 2. Check HMAC signature if not yet verified
      if (!isVerified && signature && this.webhookSecret) {
        // Strip "sha256=" or "sha256:" prefix if present
        const cleanSig = signature.replace(/^sha256[=:\s]/i, '').trim().toLowerCase();
        const rawBodyStr = rawBody
          ? Buffer.isBuffer(rawBody)
            ? rawBody.toString('utf-8')
            : String(rawBody)
          : null;

        // SePay HMAC specification signs `${timestamp}.${raw_body}`
        const candidates: string[] = [];
        if (timestamp && rawBodyStr) {
          candidates.push(`${timestamp}.${rawBodyStr}`);
        }
        if (rawBodyStr) {
          candidates.push(rawBodyStr);
        }
        if (timestamp) {
          candidates.push(`${timestamp}.${JSON.stringify(body)}`);
        }
        candidates.push(JSON.stringify(body));

        for (const dataToSign of candidates) {
          const expectedHex = createHmac('sha256', this.webhookSecret)
            .update(dataToSign)
            .digest('hex')
            .toLowerCase();

          try {
            const expectedBuf = Buffer.from(expectedHex, 'utf-8');
            const sigBuf = Buffer.from(cleanSig, 'utf-8');

            if (
              expectedBuf.length === sigBuf.length &&
              expectedBuf.length > 0 &&
              timingSafeEqual(expectedBuf, sigBuf)
            ) {
              isVerified = true;
              break;
            }
          } catch {
            // Buffer comparison failure fallback
          }
        }
      }

      if (!isVerified) {
        if (!signature && !authHeader) {
          this.logger.warn('SePay webhook rejected: missing signature or authorization header');
          throw new BadRequestException('Missing signature or authorization header');
        }
        this.logger.warn(`SePay webhook rejected: invalid signature [${signature}]`);
        throw new BadRequestException('Invalid signature');
      }
    } else {
      this.logger.warn('SEPAY_WEBHOOK_SECRET is not configured; skipping signature verification');
    }

    const content = String(body.content || '');
    const description = String(body.description || '');
    const code = String(body.code || '');
    const referenceCode = String(body.referenceCode || '');
    const transferAmount = Number(body.transferAmount);

    if (!content && !description && !code && !referenceCode) {
      throw new BadRequestException('Missing payment reference content');
    }

    // Try extracting AG reference pattern (e.g. AGF024ED533748 or AG...)
    const fullText = `${code} ${content} ${description} ${referenceCode}`;
    const refMatch =
      fullText.match(/AG[A-Z0-9]{12}/i) ||
      fullText.match(/AG[A-Z0-9]{6,16}/i);
    const targetRef = refMatch
      ? refMatch[0].toUpperCase()
      : (code || content || description || referenceCode).trim();

    // 1. Find by sepayRef
    let order = await this.prisma.order.findFirst({
      where: {
        sepayRef: targetRef,
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      },
    });

    // 2. Fallback: Find by orderNumber
    if (!order) {
      order = await this.prisma.order.findFirst({
        where: {
          orderNumber: targetRef,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.SEPAY,
        },
      });
    }

    if (!order) {
      this.logger.warn(`No matching pending order for reference: ${targetRef}`);
      return { success: false, message: 'No matching order' };
    }

    if (order.paymentStatus === 'PAID' || order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, message: 'Already paid' };
    }

    if (Number.isNaN(transferAmount) || transferAmount < Number(order.total)) {
      this.logger.warn(
        `Insufficient payment for order ${order.orderNumber}: received ${transferAmount}, expected ${order.total}`,
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
