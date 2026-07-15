import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Modal from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: ReactNode;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmLabel,
  cancelLabel,
  isLoading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const isMountedRef = useRef(true);
  // Ref-based re-entrancy guard so two synchronous clicks in the same tick
  // (e.g. before React rerenders) only invoke onConfirm once.
  const inFlightRef = useRef(false);
  const loading = isLoading || isPending;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsPending(false);
      inFlightRef.current = false;
    }
  }, [isOpen]);

  const handleCancel = () => {
    if (!loading) onCancel();
  };

  const handleConfirm = async () => {
    if (loading || confirmDisabled || inFlightRef.current) return;
    inFlightRef.current = true;

    let result: void | Promise<void>;
    try {
      result = onConfirm();
    } catch (error) {
      // Caller owns presentation of domain errors; this component only resets
      // its pending state and keeps the button retryable.
      // eslint-disable-next-line no-console
      console.error(error);
      inFlightRef.current = false;
      return;
    }

    if (!result || typeof (result as Promise<void>).then !== 'function') {
      inFlightRef.current = false;
      return;
    }

    setIsPending(true);
    try {
      await result;
    } catch (error) {
      // The caller owns presentation of domain errors; this component only resets its pending state.
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      if (isMountedRef.current) setIsPending(false);
      inFlightRef.current = false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      closeOnEscape={!loading}
      closeOnOverlay={!loading}
    >
      <div className="flex flex-col gap-lg">
        <div className="body-md text-on-surface-variant">{description}</div>
        <div className="flex flex-wrap justify-end gap-sm">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => void handleConfirm()}
            disabled={loading || confirmDisabled}
            isLoading={loading}
            loadingLabel={t('common.loading')}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
