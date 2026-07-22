// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../../i18n';
import type { AdminNotification } from '../../types';
import NotificationBell from './NotificationBell';

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

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

afterEach(() => {
  cleanup();
});

function renderBell(
  props: Partial<React.ComponentProps<typeof NotificationBell>> = {},
) {
  const markAllRead = props.markAllRead ?? vi.fn().mockResolvedValue(undefined);
  const view = render(
    <MemoryRouter initialEntries={['/orders']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <NotificationBell
                notifications={props.notifications ?? [newOrderNotification]}
                unreadCount={props.unreadCount ?? 1}
                loading={props.loading ?? false}
                markAllRead={markAllRead}
              />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { ...view, markAllRead };
}

describe('NotificationBell', () => {
  it('renders an unread badge and opens the shared inbox', async () => {
    const user = userEvent.setup();
    renderBell({ unreadCount: 3 });

    const button = screen.getByRole('button', { name: i18n.t('notifications.open') });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(button);

    expect(screen.getByRole('dialog', { name: i18n.t('notifications.title') })).toBeInTheDocument();
    expect(screen.getByText(newOrderNotification.title)).toBeInTheDocument();
    expect(screen.getByText(newOrderNotification.body as string)).toBeInTheDocument();
  });

  it('renders loading and empty states', async () => {
    const user = userEvent.setup();
    const loadingView = renderBell({ notifications: [], unreadCount: 0, loading: true });

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    expect(screen.getByText(i18n.t('notifications.loading'))).toBeInTheDocument();

    loadingView.unmount();
    renderBell({ notifications: [], unreadCount: 0, loading: false });

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    expect(screen.getByText(i18n.t('notifications.empty'))).toBeInTheDocument();
  });

  it('marks all notifications as read from the dropdown', async () => {
    const user = userEvent.setup();
    const { markAllRead } = renderBell();

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    await user.click(screen.getByRole('button', { name: i18n.t('notifications.markAllRead') }));

    expect(markAllRead).toHaveBeenCalledTimes(1);
  });

  it('navigates to the related order and inventory screens', async () => {
    const user = userEvent.setup();
    renderBell({ notifications: [newOrderNotification, lowStockNotification], unreadCount: 2 });

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    await user.click(screen.getByRole('button', { name: newOrderNotification.title }));
    expect(screen.getByTestId('location')).toHaveTextContent('/orders/o1');

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    const panel = screen.getByRole('dialog', { name: i18n.t('notifications.title') });
    await user.click(within(panel).getByRole('button', { name: lowStockNotification.title }));
    expect(screen.getByTestId('location')).toHaveTextContent('/inventory');
  });

  it('closes with Escape and outside click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <div>
          <button type="button">Outside</button>
          <NotificationBell
            notifications={[newOrderNotification]}
            unreadCount={1}
            loading={false}
            markAllRead={vi.fn()}
          />
        </div>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    expect(screen.getByRole('dialog', { name: i18n.t('notifications.title') })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: i18n.t('notifications.title') })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: i18n.t('notifications.open') }));
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog', { name: i18n.t('notifications.title') })).not.toBeInTheDocument();
  });
});
