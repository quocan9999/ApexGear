import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../i18n';
import AddressBook from './AddressBook';

vi.mock('../../services/addresses.service', () => ({
  addressesService: { getAll: vi.fn(), remove: vi.fn(), setDefault: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../hooks/useProvinces', () => ({
  useProvinces: () => ({ provinces: [], districts: [], wards: [], selectProvince: vi.fn(),
    selectDistrict: vi.fn(), selectWard: vi.fn(), selectedProvince: null, selectedDistrict: null,
    selectedWard: null, loading: false }),
}));
import { addressesService } from '../../services/addresses.service';

const addr = {
  id: 'a1', userId: 'u1', name: 'Nguyen Van A', phone: '0900000000', provinceCode: '79', provinceName: 'HCM',
  districtCode: '760', districtName: 'Q1', wardCode: '1', wardName: 'W', detail: '12 Le Loi', isDefault: true,
  createdAt: 'x', updatedAt: 'x',
};

const addr2 = { ...addr, id: 'a2', name: 'Nguyen Van B', isDefault: false };

beforeEach(() => vi.clearAllMocks());

describe('AddressBook', () => {
  it('lists saved addresses with a default badge', async () => {
    (addressesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([addr]);
    render(<AddressBook />);
    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument());
    expect(screen.getByText(/mặc định/i)).toBeInTheDocument();
  });

  it('deletes an address after confirm', async () => {
    (addressesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([addr]);
    (addressesService.remove as ReturnType<typeof vi.fn>).mockResolvedValue({ message: 'ok' });
    render(<AddressBook />);
    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /xoá/i }));
    await userEvent.click(screen.getByRole('button', { name: /xác nhận/i }));
    await waitFor(() => expect(addressesService.remove).toHaveBeenCalledWith('a1'));
  });

  it('sets a non-default address as default and refreshes', async () => {
    (addressesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([addr2]);
    (addressesService.setDefault as ReturnType<typeof vi.fn>).mockResolvedValue(addr2);
    render(<AddressBook />);
    await waitFor(() => expect(screen.getByText('Nguyen Van B')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /đặt làm mặc định/i }));
    await waitFor(() => expect(addressesService.setDefault).toHaveBeenCalledWith('a2'));
    // getAll called once on mount, once after set-default refresh.
    expect((addressesService.getAll as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('adds a new address through the reused AddressForm', async () => {
    (addressesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<AddressBook />);
    await waitFor(() => expect(addressesService.getAll).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: /thêm địa chỉ/i }));
    // The reused AddressForm renders its save button.
    expect(screen.getByRole('button', { name: /lưu địa chỉ/i })).toBeInTheDocument();
  });
});
