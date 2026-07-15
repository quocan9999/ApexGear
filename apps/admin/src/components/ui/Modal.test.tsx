import { useRef, useState } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { ConfirmDialog, Modal } from './index';

function ModalHarness() {
  const [open, setOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  return (
    <div data-testid="render-root">
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Dialog title"
        initialFocusRef={initialFocusRef}
      >
        <button ref={initialFocusRef} type="button">First action</button>
        <button type="button">Last action</button>
      </Modal>
    </div>
  );
}

function OutOfOrderModalHarness() {
  const [outerOpen, setOuterOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOuterOpen(true)}>Open outer</button>
      {outerOpen && (
        <Modal isOpen onClose={() => setOuterOpen(false)} title="Outer dialog">
          <button type="button" onClick={() => setNestedOpen(true)}>Open nested</button>
        </Modal>
      )}
      <Modal isOpen={nestedOpen} onClose={() => setNestedOpen(false)} title="Nested dialog">
        <button type="button" onClick={() => setOuterOpen(false)}>Remove outer</button>
        <button type="button" onClick={() => setNestedOpen(false)}>Close nested</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders through a portal and only closes on the overlay, not inside content', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const { unmount } = render(
      <Modal isOpen onClose={onClose} title="Portal dialog">
        <button type="button">Inside</button>
      </Modal>,
      { container: host },
    );

    const dialog = screen.getByRole('dialog', { name: 'Portal dialog' });
    expect(host).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);

    await user.click(within(dialog).getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    host.remove();
  });

  it('traps focus, closes on Escape, restores focus, and restores body scrolling', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    render(<ModalHarness />);

    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Dialog title' });
    const first = within(dialog).getByRole('button', { name: 'First action' });
    const last = within(dialog).getByRole('button', { name: 'Last action' });
    await waitFor(() => expect(first).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('restores the connected ancestor opener after nested modals close out of order', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'auto';
    render(<OutOfOrderModalHarness />);

    const opener = screen.getByRole('button', { name: 'Open outer' });
    await user.click(opener);
    const nestedOpener = await screen.findByRole('button', { name: 'Open nested' });
    await waitFor(() => expect(nestedOpener).toHaveFocus());

    await user.click(nestedOpener);
    const nestedDialog = screen.getByRole('dialog', { name: 'Nested dialog' });
    const removeOuter = within(nestedDialog).getByRole('button', { name: 'Remove outer' });
    await waitFor(() => expect(removeOuter).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(removeOuter);
    expect(screen.queryByRole('dialog', { name: 'Outer dialog' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nested dialog' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(within(nestedDialog).getByRole('button', { name: 'Close nested' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });
});

describe('ConfirmDialog', () => {
  const dialogProps = {
    isOpen: true,
    title: 'Delete item',
    description: 'This cannot be undone',
  } as const;

  it('calls confirm and treats Escape as cancel', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog {...dialogProps} onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.confirm') }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmDialog {...dialogProps} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles a synchronous confirmation throw and allows a retry', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => {
      throw new Error('domain failure');
    });
    render(
      <ConfirmDialog {...dialogProps} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    await user.click(confirm);
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(confirm).toBeEnabled();
  });

  it('handles a rejected confirmation and resets pending state', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => Promise.reject(new Error('domain failure')));
    render(
      <ConfirmDialog {...dialogProps} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(confirm).toBeEnabled());
    expect(confirm).not.toHaveAttribute('aria-busy');
  });

  it('prevents duplicate confirmation before React rerenders', async () => {
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    render(
      <ConfirmDialog {...dialogProps} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    act(() => {
      confirm.click();
      confirm.click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(confirm).toBeEnabled());
  });

  it('suppresses cancel, Escape, and overlay close while an internal confirmation is pending', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const onCancel = vi.fn();
    render(
      <ConfirmDialog {...dialogProps} variant="danger" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');

    await user.click(screen.getByRole('button', { name: i18n.t('common.cancel') }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onCancel).not.toHaveBeenCalled();

    resolve();
    await waitFor(() => expect(confirm).toBeEnabled());
  });

  it('suppresses cancel, Escape, overlay close, and confirm while controlled loading is active', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...dialogProps}
        isLoading
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    await user.click(screen.getByRole('button', { name: i18n.t('common.cancel') }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog').parentElement!);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
