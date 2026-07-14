import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../../i18n';
import ReviewForm from './ReviewForm';

vi.mock('../../services/reviews.service', () => ({
  reviewsService: { create: vi.fn() },
}));
import { reviewsService } from '../../services/reviews.service';

const createMock = reviewsService.create as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

function renderForm(onSubmitted = vi.fn()) {
  render(
    <MemoryRouter>
      <ReviewForm productId="p1" onSubmitted={onSubmitted} />
    </MemoryRouter>,
  );
  return onSubmitted;
}

describe('ReviewForm', () => {
  it('requires a rating before submit', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /gửi đánh giá/i }));
    expect(createMock).not.toHaveBeenCalled();
    // Validation message is surfaced.
    expect(await screen.findByText(/vui lòng chọn số sao/i)).toBeInTheDocument();
  });

  it('submits rating + comment then calls onSubmitted', async () => {
    createMock.mockResolvedValue({ id: 'r1' });
    const onSubmitted = renderForm();
    await userEvent.click(screen.getByRole('button', { name: /5 sao|5 star/i }));
    await userEvent.type(screen.getByRole('textbox'), 'Sản phẩm tốt');
    await userEvent.click(screen.getByRole('button', { name: /gửi đánh giá/i }));
    // Service signature is a single object payload (source of truth: reviews.service.ts).
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        productId: 'p1',
        rating: 5,
        comment: 'Sản phẩm tốt',
      }),
    );
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
  });

  it('shows an already-reviewed message on 409', async () => {
    createMock.mockRejectedValue({ status: 409, message: 'dup' });
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /5 sao|5 star/i }));
    await userEvent.click(screen.getByRole('button', { name: /gửi đánh giá/i }));
    expect(await screen.findByText(/đã đánh giá/i)).toBeInTheDocument();
  });
});
