import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAuthInit } from './hooks/useAuth';
import i18n from './i18n';

vi.mock('./hooks/useAuth', () => ({
  useAuthInit: vi.fn(),
}));

const adminTitle = i18n.t('admin.title');

afterEach(() => {
  i18n.addResource('vi', 'translation', 'admin.title', adminTitle);
});

beforeEach(() => vi.clearAllMocks());

describe('App', () => {
  it('initializes auth and renders the localized admin placeholder', () => {
    i18n.addResource('vi', 'translation', 'admin.title', 'Bảng quản trị thử nghiệm');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(useAuthInit).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Bảng quản trị thử nghiệm')).toBeInTheDocument();
  });
});
