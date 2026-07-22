import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { notificationsService } from './notifications.service';
import type { AdminNotification } from '../types';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const notification: AdminNotification = {
  id: 'n1',
  dedupeKey: 'NEW_ORDER:o1',
  type: 'NEW_ORDER',
  title: 'Đơn hàng mới #AG-1',
  body: 'Tổng 230.000 ₫',
  orderId: 'o1',
  variantId: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-07-22T12:00:00.000Z',
  updatedAt: '2026-07-22T12:00:00.000Z',
};

describe('notificationsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('list hits /admin/notifications with params and keeps meta', async () => {
    const payload = {
      data: [notification],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await notificationsService.list({ page: 1, search: 'AG' });

    expect(api.get).toHaveBeenCalledWith('/admin/notifications', {
      params: { page: 1, search: 'AG' },
    });
    expect(result).toEqual(payload);
  });

  it('unreadCount unwraps the shared unread count', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: 3 } });

    const result = await notificationsService.unreadCount();

    expect(api.get).toHaveBeenCalledWith('/admin/notifications/unread-count');
    expect(result).toBe(3);
  });

  it('markAllRead returns the updated row count', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: { count: 4 } } });

    const result = await notificationsService.markAllRead();

    expect(api.patch).toHaveBeenCalledWith('/admin/notifications/mark-all-read');
    expect(result).toEqual({ count: 4 });
  });
});
