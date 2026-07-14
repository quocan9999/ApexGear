import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import AccountPage from './AccountPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Nguyen Van A', email: 'a@x.com', phone: '0900000000' },
    isAuthenticated: true, isLoading: false }),
}));
vi.mock('../services/addresses.service', () => ({ addressesService: { getAll: vi.fn().mockResolvedValue([]) } }));

describe('AccountPage', () => {
  it('renders the account sections with the user name', () => {
    render(<MemoryRouter><AccountPage /></MemoryRouter>);
    expect(screen.getByText(/Nguyen Van A/)).toBeInTheDocument();
    expect(screen.getByText(/đổi mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByText(/sổ địa chỉ/i)).toBeInTheDocument();
  });
});
