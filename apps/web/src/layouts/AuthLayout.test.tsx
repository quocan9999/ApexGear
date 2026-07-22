import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n';

const authState = { isAuthenticated: false, isLoading: false };
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

import AuthLayout from './AuthLayout';

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

describe('AuthLayout', () => {
  it('keeps auth routes visible while a form submission is loading', () => {
    authState.isLoading = true;

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<h1>Đăng ký tài khoản</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Đăng ký tài khoản')).toBeInTheDocument();
  });

  it('uses only the top ApexGear home link, without a duplicate bottom home link', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<h1>Đăng ký tài khoản</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /ApexGear/i })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Quay lại trang chủ' })).not.toBeInTheDocument();
  });
});
