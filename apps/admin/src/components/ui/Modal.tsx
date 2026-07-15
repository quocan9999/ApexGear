import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const modalStack: symbol[] = [];
const focusStack: HTMLElement[] = [];
let bodyLockCount = 0;
let originalBodyOverflow = '';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isTopModal(id: symbol) {
  return modalStack[modalStack.length - 1] === id;
}

function lockBody() {
  if (bodyLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
  }
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true' && element.tabIndex >= 0,
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  initialFocusRef,
  closeOnEscape = true,
  closeOnOverlay = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const modalIdRef = useRef(Symbol('modal'));
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const modalId = modalIdRef.current;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (previousFocusRef.current) focusStack.push(previousFocusRef.current);
    modalStack.push(modalId);
    lockBody();

    const focusTimer = window.setTimeout(() => {
      if (!isTopModal(modalId)) return;
      const dialog = dialogRef.current;
      const target = initialFocusRef?.current ?? (dialog ? getFocusableElements(dialog)[0] : null) ?? dialog;
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      const wasTopModal = isTopModal(modalId);
      const index = modalStack.lastIndexOf(modalId);
      if (index >= 0) modalStack.splice(index, 1);
      unlockBody();

      // Out-of-order closure: this modal is closing while a nested one is
      // still open. Leave the focus stack alone — the nested modal still
      // owns focus and will pop its own entry when it closes.
      if (!wasTopModal) return;

      // Pop our entry from the focus stack before walking, so a stale
      // disconnected opener doesn't block the walk from reaching a still-
      // connected ancestor.
      if (previousFocusRef.current) {
        const focusIndex = focusStack.lastIndexOf(previousFocusRef.current);
        if (focusIndex >= 0) focusStack.splice(focusIndex, 1);
      }

      // Restore focus: prefer the direct previous-focus target if still
      // connected; otherwise walk the focus stack to find the next surviving
      // ancestor opener (used when an outer modal was removed while nested
      // modals were still open).
      const direct = previousFocusRef.current;
      if (direct && direct.isConnected) {
        direct.focus();
        return;
      }
      for (let i = focusStack.length - 1; i >= 0; i -= 1) {
        const candidate = focusStack[i];
        if (candidate && candidate.isConnected) {
          candidate.focus();
          return;
        }
      }
    };
  }, [initialFocusRef, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal(modalIdRef.current)) return;

      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      closeOnOverlay
      && event.target === event.currentTarget
      && isTopModal(modalIdRef.current)
    ) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-md"
      onMouseDown={handleOverlayClick}
      data-modal-overlay
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest p-lg text-on-surface shadow-[var(--shadow-level-2)]',
          className,
        )}
      >
        <h2 id={titleId} className="headline-md mb-md">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
