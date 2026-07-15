import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { Button, Input, Spinner } from './index';

describe('admin UI primitives', () => {
  it('renders a button and exposes its loading state accessibly', () => {
    const { rerender } = render(<Button>Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeEnabled();

    rerender(<Button isLoading>Action</Button>);

    expect(screen.getByRole('button', { name: 'Action' })).toBeDisabled();
    expect(screen.getByRole('status', { name: i18n.t('common.loading') })).toBeInTheDocument();
  });

  it('associates an input with its label and error', () => {
    render(<Input id="email" label="Email" error="Required" />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('renders a localized fullscreen spinner', () => {
    render(<Spinner fullscreen />);

    const spinner = screen.getByRole('status', { name: i18n.t('common.loading') });
    expect(spinner.parentElement).toHaveClass('fixed', 'inset-0');
  });
});
