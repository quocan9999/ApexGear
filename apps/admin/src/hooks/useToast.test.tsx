import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import i18n from '../i18n';
import { ToastProvider, useToast } from './useToast';

function ToastHarness() {
  const { showToast } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => showToast({ title: 'Saved', variant: 'success', duration: 1_000 })}
      >
        Add saved
      </button>
      <button
        type="button"
        onClick={() => showToast({ title: 'Failed', description: 'Try again', variant: 'error', duration: 0 })}
      >
        Add failed
      </button>
    </div>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useToast', () => {
  it('queues toasts and supports manual dismissal', () => {
    renderToasts();

    fireEvent.click(screen.getByRole('button', { name: 'Add saved' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add failed' }));

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    const failedToast = screen.getByText('Failed').closest('[data-toast]');
    expect(failedToast).not.toBeNull();
    fireEvent.click(within(failedToast as HTMLElement).getByRole('button', { name: i18n.t('toast.dismiss') }));

    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('automatically dismisses a toast after its duration', () => {
    vi.useFakeTimers();
    renderToasts();

    fireEvent.click(screen.getByRole('button', { name: 'Add saved' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('requires a scoped provider', () => {
    expect(() => render(<ToastHarness />)).toThrow(i18n.t('toast.providerMissing'));
  });
});
