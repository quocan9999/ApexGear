import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notificationsService } from '../services/notifications.service';
import type { AdminNotification } from '../types';
import { useToast } from './useToast';

const DEFAULT_LIMIT = 20;
const STREAM_URL = '/api/admin/notifications/stream';

function toastVariantFor(notification: AdminNotification) {
  return notification.type === 'LOW_STOCK' ? 'warning' : 'info';
}

function mergeNotification(list: AdminNotification[], notification: AdminNotification) {
  const next = list.filter((item) => item.id !== notification.id);
  return [notification, ...next];
}

export function useAdminNotifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [listResult, unread] = await Promise.all([
        notificationsService.list({ page: 1, limit: DEFAULT_LIMIT }),
        notificationsService.unreadCount(),
      ]);
      setNotifications(listResult.data);
      setUnreadCount(unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    const eventSource = new EventSource(STREAM_URL);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as AdminNotification;
        setNotifications((current) => mergeNotification(current, notification));
        if (!notification.isRead) {
          setUnreadCount((current) => current + 1);
        }
        showToast({
          title: notification.title,
          description: notification.body ?? undefined,
          variant: toastVariantFor(notification),
        });
      } catch {
        // Ignore malformed payloads and keep the stream alive.
      }
    };

    eventSource.onerror = () => {
      // Let the browser retry the stream. Cleanup happens on unmount.
    };

    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [showToast]);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    setUnreadCount(0);
    setNotifications((current) =>
      current.map((notification) =>
        notification.isRead
          ? notification
          : {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            },
      ),
    );
  }, []);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAllRead,
    }),
    [loading, markAllRead, notifications, refresh, unreadCount],
  );
}
