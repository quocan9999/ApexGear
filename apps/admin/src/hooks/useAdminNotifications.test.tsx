// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationsService } from '../services/notifications.service';
import type { AdminNotification } from '../types';
import { useAdminNotifications } from './useAdminNotifications';

const showToast = vi.fn();

vi.mock('./useToast', () => ({
  useToast: () => ({ showToast }),
}));

vi.mock('../services/notifications.service', () => ({
  notificationsService: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const newOrderNotification: AdminNotification = {
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

const lowStockNotification: AdminNotification = {
  ...newOrderNotification,
  id: 'n2',
  dedupeKey: 'LOW_STOCK:v1:5:123',
  type: 'LOW_STOCK',
  title: 'Sắp hết hàng: SKU-1',
  body: 'Chuột Apex chỉ còn 5 sản phẩm',
  orderId: null,
  variantId: 'v1',
};

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
}

describe('useAdminNotifications', () => {
  beforeEach(() => {
    vi.mocked(notificationsService.list).mockReset();
    vi.mocked(notificationsService.unreadCount).mockReset();
    vi.mocked(notificationsService.markAllRead).mockReset();
    showToast.mockReset();
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  it('loads unread count and notification list on mount', async () => {
    vi.mocked(notificationsService.list).mockResolvedValueOnce({
      data: [newOrderNotification],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(notificationsService.unreadCount).mockResolvedValueOnce(2);

    const { result } = renderHook(() => useAdminNotifications());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(notificationsService.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(notificationsService.unreadCount).toHaveBeenCalled();
    expect(result.current.notifications).toEqual([newOrderNotification]);
    expect(result.current.unreadCount).toBe(2);
    expect(MockEventSource.instances[0].url).toBe('/api/admin/notifications/stream');
  });

  it('merges SSE events, increments unread count, and shows matching toast', async () => {
    vi.mocked(notificationsService.list).mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    vi.mocked(notificationsService.unreadCount).mockResolvedValueOnce(0);

    const { result } = renderHook(() => useAdminNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      MockEventSource.instances[0].onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(lowStockNotification) }),
      );
    });

    expect(result.current.notifications).toEqual([lowStockNotification]);
    expect(result.current.unreadCount).toBe(1);
    expect(showToast).toHaveBeenCalledWith({
      title: lowStockNotification.title,
      description: lowStockNotification.body,
      variant: 'warning',
    });
  });

  it('marks the shared inbox as read and updates local state', async () => {
    vi.mocked(notificationsService.list).mockResolvedValueOnce({
      data: [newOrderNotification, lowStockNotification],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    vi.mocked(notificationsService.unreadCount).mockResolvedValueOnce(2);
    vi.mocked(notificationsService.markAllRead).mockResolvedValueOnce({ count: 2 });

    const { result } = renderHook(() => useAdminNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(notificationsService.markAllRead).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((notification) => notification.isRead)).toBe(true);
  });

  it('closes the EventSource on unmount', async () => {
    vi.mocked(notificationsService.list).mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    vi.mocked(notificationsService.unreadCount).mockResolvedValueOnce(0);

    const { unmount } = renderHook(() => useAdminNotifications());
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    const instance = MockEventSource.instances[0];
    unmount();

    expect(instance.close).toHaveBeenCalled();
  });
});
