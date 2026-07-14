import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const authState = { isAuthenticated: false, isLoading: false };
vi.mock('../hooks/useAuth', () => ({ useAuth: () => authState }));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<div>Account Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    authState.isLoading = true;
    renderAt('/account');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Account Content')).toBeNull();
  });

  it('redirects to login when unauthenticated', () => {
    authState.isAuthenticated = false;
    renderAt('/account');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Account Content')).toBeNull();
  });

  it('renders the protected content when authenticated', () => {
    authState.isAuthenticated = true;
    renderAt('/account');
    expect(screen.getByText('Account Content')).toBeInTheDocument();
  });
});
