import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import type { Review } from '../types';
import { ReviewsPage } from './ReviewsPage';

vi.mock('../services/reviews.service', () => ({
  reviewsService: {
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

import { reviewsService } from '../services/reviews.service';

const pendingReview: Review = {
  id: 'r1',
  productId: 'p1',
  userId: 'u1',
  rating: 4,
  comment: 'Good product!',
  status: 'PENDING',
  user: { id: 'u1', email: 'test@example.com', name: 'Test User' },
  product: { id: 'p1', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const approvedReview: Review = {
  ...pendingReview,
  id: 'r2',
  product: { id: 'p2', name: 'MacBook Pro', slug: 'macbook-pro' },
  status: 'APPROVED',
  comment: 'Great laptop!',
};

function renderPage() {
  return render(<ReviewsPage />);
}

describe('ReviewsPage', () => {
  beforeEach(() => {
    vi.mocked(reviewsService.list).mockReset().mockResolvedValue({
      data: [pendingReview, approvedReview],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    vi.mocked(reviewsService.updateStatus).mockReset().mockResolvedValue({
      ...pendingReview,
      status: 'APPROVED',
    });
  });

  it('renders review list with products and users', async () => {
    renderPage();
    expect(await screen.findByText('Sony WH-1000XM5')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getAllByText('Test User')).toHaveLength(2);
    expect(screen.getByText('Great laptop!')).toBeInTheDocument();
  });

  it('pending review has approve/reject buttons', async () => {
    renderPage();
    await screen.findByText('Sony WH-1000XM5');
    expect(screen.getByRole('button', { name: i18n.t('pages.reviews.approve') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('pages.reviews.reject') })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: i18n.t('pages.reviews.approve') })).toHaveLength(1);
  });

  it('filters by PENDING', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    await user.selectOptions(screen.getByLabelText(i18n.t('pages.reviews.filters.status')), 'PENDING');

    await waitFor(() => {
      expect(reviewsService.list).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING', page: 1 }),
      );
    });
  });

  it('approve calls updateStatus with APPROVED', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    await user.click(screen.getByRole('button', { name: i18n.t('pages.reviews.approve') }));

    await waitFor(() => {
      expect(reviewsService.updateStatus).toHaveBeenCalledWith('r1', 'APPROVED');
    });
  });
});
