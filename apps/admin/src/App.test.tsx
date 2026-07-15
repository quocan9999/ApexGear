import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, describe, it, expect } from 'vitest';
import App from './App';
import i18n from './i18n';

const adminTitle = i18n.t('admin.title');

afterEach(() => {
  i18n.addResource('vi', 'translation', 'admin.title', adminTitle);
});

describe('App', () => {
  it('renders the localized admin placeholder', () => {
    i18n.addResource('vi', 'translation', 'admin.title', 'Bảng quản trị thử nghiệm');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(screen.getByText('Bảng quản trị thử nghiệm')).toBeInTheDocument();
  });
});
