import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enums';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let eventEmitter: EventEmitter2;
  let emailService: { sendOrderConfirmation: jest.Mock };
  const secret = 'test-secret';

  beforeEach(() => {
    prisma = createPrismaMock();
    const config = {
      get: jest.fn((key: string, def?: string) => {
        if (key === 'SEPAY_WEBHOOK_SECRET') return secret;
        if (key === 'SEPAY_BANK_ACCOUNT') return '0123456789';
        return def ?? '';
      }),
    };
    eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;
    emailService = { sendOrderConfirmation: jest.fn().mockResolvedValue(undefined) };
    service = new PaymentsService(
      prisma as never,
      config as unknown as ConfigService,
      eventEmitter,
      emailService as never,
    );
  });

  function sign(body: Record<string, unknown>) {
    return createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
  }

  describe('getQrData', () => {
    it('throws when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.getQrData('u1', 'o1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when sepayRef missing', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        sepayRef: null,
        total: 100,
        orderNumber: 'AG-1',
        createdAt: new Date(),
      });
      await expect(service.getQrData('u1', 'o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns QR payload', async () => {
      const createdAt = new Date('2026-07-14T10:00:00.000Z');
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        sepayRef: 'AGABC123',
        total: 150000,
        orderNumber: 'AG-1',
        createdAt,
      });

      const result = await service.getQrData('u1', 'o1');
      expect(result).toEqual({
        bankAccount: '0123456789',
        bankId: 'MB',
        amount: 150000,
        content: 'AGABC123',
        orderNumber: 'AG-1',
        expiresAt: new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString(),
      });
    });
  });

  describe('handleWebhook', () => {
    it('rejects missing signature when secret configured', async () => {
      await expect(
        service.handleWebhook({ content: 'x', transferAmount: 1 }),
      ).rejects.toThrow(/Missing signature/);
    });

    it('rejects invalid signature', async () => {
      await expect(
        service.handleWebhook(
          { content: 'x', transferAmount: 1 },
          'deadbeef',
        ),
      ).rejects.toThrow(/Invalid signature/);
    });

    it('accepts signature with sha256= prefix and timestamp', async () => {
      const body = { content: 'AGREF', transferAmount: 100000 };
      const rawBody = JSON.stringify(body);
      const timestamp = '1786122906';
      const sigHex = createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
      const sigWithPrefix = `sha256=${sigHex}`;

      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        total: 100000,
        orderNumber: 'AG-1',
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      });
      prisma.order.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, {
        signature: sigWithPrefix,
        timestamp,
        rawBody,
      });
      expect(result).toEqual({ success: true, orderNumber: 'AG-1' });
    });

    it('accepts authorization header with Apikey', async () => {
      const body = { content: 'AGREF', transferAmount: 100000 };
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        total: 100000,
        orderNumber: 'AG-1',
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      });
      prisma.order.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, {
        authHeader: `Apikey ${secret}`,
      });
      expect(result).toEqual({ success: true, orderNumber: 'AG-1' });
    });

    it('extracts AG reference from full transfer description or code', async () => {
      const body = {
        code: 'AGF024ED533748',
        content: 'MBVCB 123456 AGF024ED533748 CHUYEN KHOAN',
        transferAmount: 6090000,
      };
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        total: 6090000,
        orderNumber: 'AG-1',
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      });
      prisma.order.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, {
        authHeader: `Apikey ${secret}`,
      });
      expect(result).toEqual({ success: true, orderNumber: 'AG-1' });
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          sepayRef: 'AGF024ED533748',
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.SEPAY,
        },
        include: { user: true },
      });
    });

    it('returns success:false when no matching order', async () => {
      const body = { content: 'AGREF', transferAmount: 100000 };
      prisma.order.findFirst.mockResolvedValue(null);
      const result = await service.handleWebhook(body, sign(body));
      expect(result).toEqual({
        success: false,
        message: 'No matching order',
      });
    });

    it('returns success:false when amount insufficient', async () => {
      const body = { content: 'AGREF', transferAmount: 1000 };
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        total: 100000,
        orderNumber: 'AG-1',
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
      });
      const result = await service.handleWebhook(body, sign(body));
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Insufficient/);
    });

    it('marks order paid on valid webhook and sends confirmation email', async () => {
      const body = { content: 'AGREF', transferAmount: 100000 };
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        total: 100000,
        orderNumber: 'AG-1',
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.SEPAY,
        user: { email: 'user@example.com', name: 'John Doe' },
      });
      prisma.order.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, sign(body));
      expect(result).toEqual({ success: true, orderNumber: 'AG-1' });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        },
      });
      expect(emailService.sendOrderConfirmation).toHaveBeenCalledWith(
        'user@example.com',
        'John Doe',
        {
          orderNumber: 'AG-1',
          total: 100000,
          paymentMethod: PaymentMethod.SEPAY,
        },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.paid', {
        orderId: 'o1',
        orderNumber: 'AG-1',
      });
    });
  });
});
