import { EventEmitter2 } from '@nestjs/event-emitter';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { NotificationsService, LOW_STOCK_THRESHOLD } from './notifications.service';

describe('NotificationsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let eventEmitter: { emit: jest.Mock };
  let service: NotificationsService;

  const notification = {
    id: 'n1',
    dedupeKey: 'NEW_ORDER:o1',
    type: 'NEW_ORDER',
    title: 'Đơn hàng mới #AG-1',
    body: 'Tổng 230.000 ₫',
    orderId: 'o1',
    variantId: null,
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-07-22T12:00:00.000Z'),
    updatedAt: new Date('2026-07-22T12:00:00.000Z'),
  };

  const variant = {
    id: 'v1',
    sku: 'SKU-1',
    name: 'Black',
    stockAvailable: LOW_STOCK_THRESHOLD,
    lowStockThreshold: 99,
    product: { id: 'p1', name: 'Chuột Apex', slug: 'chuot-apex' },
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    eventEmitter = { emit: jest.fn() };
    service = new NotificationsService(
      prisma as never,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('records one shared new-order notification and emits it', async () => {
    prisma.adminNotification.upsert.mockResolvedValue(notification);

    const result = await service.recordNewOrder({
      orderId: 'o1',
      orderNumber: 'AG-1',
      total: 230000,
    });

    expect(prisma.adminNotification.upsert).toHaveBeenCalledWith({
      where: { dedupeKey: 'NEW_ORDER:o1' },
      create: expect.objectContaining({
        dedupeKey: 'NEW_ORDER:o1',
        type: 'NEW_ORDER',
        title: 'Đơn hàng mới #AG-1',
        orderId: 'o1',
      }),
      update: expect.objectContaining({ title: 'Đơn hàng mới #AG-1' }),
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith('admin.notification', notification);
    expect(result).toBe(notification);
  });

  it('creates a low-stock notification when an inactive variant is at the fixed threshold', async () => {
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    const lowStockNotification = {
      ...notification,
      dedupeKey: 'LOW_STOCK:v1:5:1234567890',
      type: 'LOW_STOCK',
      title: 'Sắp hết hàng: SKU-1',
      body: 'Chuột Apex chỉ còn 5 sản phẩm',
      orderId: null,
      variantId: 'v1',
    };
    prisma.lowStockAlertState.findUnique.mockResolvedValue({
      id: 's1',
      variantId: 'v1',
      isActive: false,
    });
    prisma.adminNotification.create.mockResolvedValue(lowStockNotification);
    prisma.lowStockAlertState.upsert.mockResolvedValue({});

    const result = await service.syncLowStockState(variant);

    expect(prisma.adminNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dedupeKey: 'LOW_STOCK:v1:5:1234567890',
        type: 'LOW_STOCK',
        title: 'Sắp hết hàng: SKU-1',
        body: 'Chuột Apex chỉ còn 5 sản phẩm',
        variantId: 'v1',
      }),
    });
    expect(prisma.lowStockAlertState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { variantId: 'v1' },
        update: expect.objectContaining({
          isActive: true,
          lastNotifiedStock: LOW_STOCK_THRESHOLD,
          resolvedAt: null,
        }),
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin.notification',
      lowStockNotification,
    );
    expect(result).toBe(lowStockNotification);
    dateNowSpy.mockRestore();
  });

  it('does not duplicate low-stock notifications while the variant remains active-low', async () => {
    const activeState = {
      id: 's1',
      variantId: 'v1',
      isActive: true,
      lastNotifiedStock: LOW_STOCK_THRESHOLD,
    };
    prisma.lowStockAlertState.findUnique.mockResolvedValue(activeState);

    const result = await service.syncLowStockState({
      ...variant,
      stockAvailable: 2,
    });

    expect(prisma.adminNotification.create).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
    expect(result).toBe(activeState);
  });

  it('clears active low-stock state when stock rises above the fixed threshold', async () => {
    prisma.lowStockAlertState.findUnique.mockResolvedValue({
      id: 's1',
      variantId: 'v1',
      isActive: true,
    });
    prisma.lowStockAlertState.upsert.mockResolvedValue({
      id: 's1',
      variantId: 'v1',
      isActive: false,
    });

    await service.syncLowStockState({
      ...variant,
      stockAvailable: LOW_STOCK_THRESHOLD + 1,
    });

    expect(prisma.adminNotification.create).not.toHaveBeenCalled();
    expect(prisma.lowStockAlertState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { variantId: 'v1' },
        update: expect.objectContaining({
          isActive: false,
          lastNotifiedStock: null,
          notifiedAt: null,
        }),
      }),
    );
  });

  it('lists notifications newest-first with pagination metadata', async () => {
    prisma.adminNotification.findMany.mockResolvedValue([notification]);
    prisma.adminNotification.count.mockResolvedValue(1);

    const result = await service.list({ page: 2, limit: 10, search: 'AG' });

    expect(prisma.adminNotification.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ title: { contains: 'AG' } }, { body: { contains: 'AG' } }],
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      data: [notification],
      meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('returns the shared unread count', async () => {
    prisma.adminNotification.count.mockResolvedValue(3);

    await expect(service.unreadCount()).resolves.toBe(3);
    expect(prisma.adminNotification.count).toHaveBeenCalledWith({
      where: { isRead: false },
    });
  });

  it('marks all unread notifications as read for the shared inbox', async () => {
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 4 });

    await expect(service.markAllRead()).resolves.toEqual({ count: 4 });
    expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
      where: { isRead: false },
      data: expect.objectContaining({
        isRead: true,
        readAt: expect.any(Date),
      }),
    });
  });
});
