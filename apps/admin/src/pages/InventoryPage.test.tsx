import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { useAuthStore } from '../stores/auth.store';
import type { InventoryItem, User } from '../types';
import { InventoryPage } from './InventoryPage';

vi.mock('../services/inventory.service', () => ({
  inventoryService: {
    list: vi.fn(),
    lowStock: vi.fn(),
    outOfStock: vi.fn(),
    adjust: vi.fn(),
  },
}));

import { inventoryService } from '../services/inventory.service';

const adminUser: User = {
  id: 'u-admin',
  email: 'admin@apexgear.vn',
  name: 'Admin',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'local',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const contentManager: User = {
  ...adminUser,
  id: 'u-cm',
  email: 'content@apexgear.vn',
  name: 'Content',
  role: 'CONTENT_MANAGER',
};

const item: InventoryItem = {
  id: 'v1',
  sku: 'WH-1000XM5-BLK',
  name: '',
  stockTotal: 50,
  stockAvailable: 45,
  lowStockThreshold: 10,
  product: { id: 'p1', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5' },
};

function renderPage() {
  return render(<InventoryPage />);
}

describe('InventoryPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, isLoading: false });
    vi.mocked(inventoryService.list).mockReset().mockResolvedValue({
      data: [item],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(inventoryService.lowStock).mockReset().mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    vi.mocked(inventoryService.outOfStock).mockReset().mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    vi.mocked(inventoryService.adjust).mockReset().mockResolvedValue(item);
  });

  it('renders inventory list for ADMIN with adjust control', async () => {
    renderPage();
    expect(await screen.findByText('Sony WH-1000XM5')).toBeInTheDocument();
    expect(screen.getByText('WH-1000XM5-BLK')).toBeInTheDocument();
    expect(inventoryService.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    // ADMIN sees adjust button (column header also has same text, scope to button)
    expect(screen.getByRole('button', { name: i18n.t('inventory.adjust') })).toBeInTheDocument();
  });

  it('adjust control hidden for CONTENT_MANAGER', async () => {
    useAuthStore.setState({ user: contentManager, isAuthenticated: true, isLoading: false });
    renderPage();
    await screen.findByText('Sony WH-1000XM5');
    expect(screen.queryByRole('button', { name: i18n.t('inventory.adjust') })).not.toBeInTheDocument();
  });

  it('switches to low-stock tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    await user.click(screen.getByRole('tab', { name: i18n.t('inventory.tabs.lowStock') }));

    expect(inventoryService.lowStock).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('calls adjust and refetches', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    const input = screen.getByLabelText(
      i18n.t('inventory.adjustInputLabel', { name: 'WH-1000XM5-BLK' }),
    );
    await user.type(input, '10');

    const adjustButtons = screen.getAllByText(i18n.t('inventory.adjust'));
    await user.click(adjustButtons[adjustButtons.length - 1]); // the row button, not column header

    await waitFor(() => {
      expect(inventoryService.adjust).toHaveBeenCalledWith('v1', 10);
      // Refetch after adjust
      expect(inventoryService.list).toHaveBeenCalledTimes(2);
    });
  });
});
