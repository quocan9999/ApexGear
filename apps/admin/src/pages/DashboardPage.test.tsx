import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { DashboardPage } from './DashboardPage';

vi.mock('../services/dashboard.service', () => ({
  dashboardService: {
    getStats: vi.fn(),
    getRevenue: vi.fn(),
  },
}));

import { dashboardService } from '../services/dashboard.service';

const stats = {
  totalOrders: 1450,
  totalRevenue: 328500000,
  totalProducts: 312,
  totalUsers: 1280,
  pendingOrders: 14,
  lowStockCount: 12,
};
const revenue7 = [
  { date: '2026-07-09', revenue: 42000000 },
  { date: '2026-07-10', revenue: 58000000 },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(dashboardService.getStats).mockReset().mockResolvedValue(stats);
    vi.mocked(dashboardService.getRevenue).mockReset().mockResolvedValue(revenue7);
  });

  it('renders four stat cards with localized labels', async () => {
    render(<DashboardPage />);
    expect(
      await screen.findByRole('heading', { level: 2, name: i18n.t('pages.dashboard.title') }),
    ).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.stats.totalRevenue'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.stats.totalOrders'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.stats.lowStock'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dashboard.stats.totalUsers'))).toBeInTheDocument();
  });

  it('formats totalRevenue with formatPrice', async () => {
    render(<DashboardPage />);
    await screen.findByRole('heading', { level: 2, name: i18n.t('pages.dashboard.title') });
    expect(screen.getByText(/328\.500\.000/)).toBeInTheDocument();
  });

  it('fetches revenue with days=7 initially', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(dashboardService.getRevenue).toHaveBeenCalledWith(7));
  });

  it('switches to days=30 when user clicks 30 Ngày', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);
    const btn = await screen.findByRole('button', { name: i18n.t('dashboard.range.30days') });
    await user.click(btn);
    await waitFor(() => expect(dashboardService.getRevenue).toHaveBeenCalledWith(30));
  });
});