import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../i18n';
import AddressForm from './AddressForm';

vi.mock('../../hooks/useProvinces', () => ({
  useProvinces: () => ({
    provinces: [{ code: '79', name: 'TP HCM' }],
    wards: [{ code: '26734', name: 'Ben Nghe' }],
    selectedProvince: { code: '79', name: 'TP HCM' },
    selectedWard: { code: '26734', name: 'Ben Nghe' },
    selectProvince: vi.fn(),
    selectWard: vi.fn(),
    loading: false,
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe('AddressForm', () => {
  it('blocks submit when required fields are empty', async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /lưu/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a well-formed payload with province/ward names', async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/họ tên/i), 'Nguyen Van A');
    await userEvent.type(screen.getByLabelText(/số điện thoại/i), '0900000000');
    await userEvent.type(screen.getByLabelText(/địa chỉ/i), '12 Le Loi');
    await userEvent.click(screen.getByRole('button', { name: /lưu/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nguyen Van A',
          phone: '0900000000',
          detail: '12 Le Loi',
          provinceName: 'TP HCM',
          wardName: 'Ben Nghe',
        }),
      ),
    );
  });
});
