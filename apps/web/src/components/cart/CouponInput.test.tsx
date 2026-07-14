import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../i18n';
import CouponInput from './CouponInput';

vi.mock('../../services/coupons.service', () => ({
  couponsService: { validate: vi.fn() },
}));
import { couponsService } from '../../services/coupons.service';

beforeEach(() => vi.clearAllMocks());

describe('CouponInput', () => {
  it('applies a valid coupon and calls onApplied with the discount', async () => {
    (couponsService.validate as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true, discount: 50000, couponId: 'c1', code: 'WELCOME', type: 'FIXED',
    });
    const onApplied = vi.fn();
    render(<CouponInput subtotal={500000} onApplied={onApplied} onCleared={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'WELCOME');
    await userEvent.click(screen.getByRole('button', { name: /áp dụng/i }));
    await waitFor(() => expect(onApplied).toHaveBeenCalledWith(expect.objectContaining({ discount: 50000 })));
  });

  it('shows an error message for an invalid coupon', async () => {
    (couponsService.validate as ReturnType<typeof vi.fn>).mockResolvedValue({ valid: false, message: 'Mã không hợp lệ' });
    render(<CouponInput subtotal={500000} onApplied={vi.fn()} onCleared={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'BAD');
    await userEvent.click(screen.getByRole('button', { name: /áp dụng/i }));
    expect(await screen.findByText(/không hợp lệ/i)).toBeInTheDocument();
  });

  it('is disabled with a hint when disabledReason is set', () => {
    render(<CouponInput subtotal={0} onApplied={vi.fn()} onCleared={vi.fn()} disabledReason="Đăng nhập để dùng mã" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByText(/đăng nhập để dùng mã/i)).toBeInTheDocument();
  });
});
