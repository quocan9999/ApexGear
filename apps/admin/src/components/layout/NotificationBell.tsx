import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AdminNotification } from '../../types';
import { formatDateTime } from '../../utils/format';

interface NotificationBellProps {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void> | void;
}

function notificationTarget(notification: AdminNotification) {
  if (notification.type === 'NEW_ORDER' && notification.orderId) {
    return `/orders/${notification.orderId}`;
  }
  if (notification.type === 'LOW_STOCK') {
    return '/inventory';
  }
  return null;
}

function notificationAccent(notification: AdminNotification) {
  return notification.type === 'LOW_STOCK' ? 'bg-warning' : 'bg-primary';
}

export default function NotificationBell({
  notifications,
  unreadCount,
  loading,
  markAllRead,
}: NotificationBellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  const handleNotificationClick = (notification: AdminNotification) => {
    const target = notificationTarget(notification);
    setOpen(false);
    if (target) navigate(target);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t('notifications.open')}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[0.6875rem] font-bold leading-5 text-on-error">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('notifications.title')}
          className="absolute right-0 top-12 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-level-3"
        >
          <div className="flex items-center justify-between gap-sm border-b border-outline-variant px-md py-sm">
            <div>
              <h2 className="label-lg text-on-surface">{t('notifications.title')}</h2>
              <p className="body-sm text-on-surface-variant">
                {t('notifications.unreadCount', { count: unreadCount })}
              </p>
            </div>
            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
              className="label-sm rounded px-sm py-xs text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('notifications.markAllRead')}
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto py-xs">
            {loading ? (
              <p className="body-sm px-md py-lg text-center text-on-surface-variant">
                {t('notifications.loading')}
              </p>
            ) : notifications.length === 0 ? (
              <p className="body-sm px-md py-lg text-center text-on-surface-variant">
                {t('notifications.empty')}
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      aria-label={notification.title}
                      onClick={() => handleNotificationClick(notification)}
                      className="grid w-full grid-cols-[0.5rem_1fr] gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 rounded-full ${notificationAccent(notification)}`}
                      />
                      <span className="min-w-0">
                        <span className="label-md block truncate text-on-surface">
                          {notification.title}
                        </span>
                        {notification.body && (
                          <span className="body-sm mt-0.5 block line-clamp-2 text-on-surface-variant">
                            {notification.body}
                          </span>
                        )}
                        <span className="label-sm mt-xs block text-on-surface-variant">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
