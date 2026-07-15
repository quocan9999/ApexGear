import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import type { Coupon } from '../types';
import { CouponsPage } from './CouponsPage';

vi.mock('../services/coupons.service', () => ({
  couponsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { couponsService } from '../services/coupons.service';

const activeCoupon: Coupon = {
  id: 'c1',
  code: 'WELCOME10',
  type: 'PERCENTAGE',
  description: null,
  value: 10,
  minOrderValue: null,
  maxDiscount: null,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const fixedCoupon: Coupon = {
  ...activeCoupon,
  id: 'c2',
  code: 'GIAM50K',
  type: 'FIXED',
  value: 50000,
  description: 'Giảm 50k',
  minOrderValue: 200000,
  maxDiscount: null,
  maxUses: 100,
  usedCount: 10,
  isActive: true,
};

function renderPage() {
  return render(<CouponsPage />);
}

describe('CouponsPage', () => {
  beforeEach(() => {
    vi.mocked(couponsService.list).mockReset();
    vi.mocked(couponsService.create).mockReset();
    vi.mocked(couponsService.update).mockReset();
    vi.mocked(couponsService.remove).mockReset();
    vi.mocked(couponsService.list).mockResolvedValue({
      data: [activeCoupon, fixedCoupon],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    vi.mocked(couponsService.create).mockResolvedValue(activeCoupon);
    vi.mocked(couponsService.update).mockResolvedValue(activeCoupon);
    vi.mocked(couponsService.remove).mockResolvedValue(undefined as never);
  });

  it('renders coupon list with codes and values', async () => {
    renderPage();
    expect(await screen.findByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('GIAM50K')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(couponsService.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('creates a PERCENTAGE coupon via modal form', async () => {
    const user = userEvent.setup();
    vi.mocked(couponsService.create).mockResolvedValue(activeCoupon);
    renderPage();

    await screen.findByText('WELCOME10');
    await user.click(screen.getByRole('button', { name: i18n.t('coupons.create') }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(i18n.t('coupons.form.code')), 'SALE20');
    await user.type(within(dialog).getByLabelText(i18n.t('coupons.form.valuePercent')), '20');

    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(couponsService.create).toHaveBeenCalledWith({
        code: 'SALE20',
        type: 'PERCENTAGE',
        value: 20,
      });
    });
  });

  it('edits a coupon with isActive toggle', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('WELCOME10');
    // click edit on first coupon
    const editButtons = screen.getAllByRole('button', { name: i18n.t('common.edit') });
    await user.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const valueInput = within(dialog).getByLabelText(i18n.t('coupons.form.valuePercent'));
    await user.clear(valueInput);
    await user.type(valueInput, '15');

    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(couponsService.update).toHaveBeenCalledWith('c1', {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 15,
        isActive: true,
      });
    });
  });

  it('confirms delete via dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('WELCOME10');
    const deleteButtons = screen.getAllByRole('button', { name: i18n.t('common.delete') });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }));

    await waitFor(() => {
      expect(couponsService.remove).toHaveBeenCalledWith('c1');
    });
  });
});
