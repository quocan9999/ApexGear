import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Toast, { type ToastVariant } from '../components/ui/Toast';

const DEFAULT_DURATION = 5_000;

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
  duration: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <Toast
      title={toast.title}
      description={toast.description}
      variant={toast.variant}
      onDismiss={() => onDismiss(toast.id)}
    />
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setToasts((current) => [
      ...current,
      {
        ...options,
        id,
        duration: options.duration ?? DEFAULT_DURATION,
      },
    ]);
    return id;
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);
  const viewport = typeof document === 'undefined'
    ? null
    : createPortal(
        <div
          className="pointer-events-none fixed top-md right-md z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-sm"
          aria-label={t('toast.notifications')}
        >
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismissToast} />
            </div>
          ))}
        </div>,
        document.body,
      );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {viewport}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  const { t } = useTranslation();
  if (!context) throw new Error(t('toast.providerMissing'));
  return context;
}
