import { useRef, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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
});

describe('ConfirmDialog', () => {
  it('calls confirm and treats Escape as cancel', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog
        isOpen
        title="Delete item"
        description="This cannot be undone"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.confirm') }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmDialog
        isOpen
        title="Delete item"
        description="This cannot be undone"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirmation while an async confirmation is pending', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    render(
      <ConfirmDialog
        isOpen
        variant="danger"
        title="Delete item"
        description="This cannot be undone"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    await user.click(confirm);
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');

    resolve();
    await waitFor(() => expect(confirm).toBeEnabled());
  });
});
