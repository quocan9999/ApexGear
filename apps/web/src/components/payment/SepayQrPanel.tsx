import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { paymentsService } from '../../services/payments.service';
import { formatPrice } from '../../utils/format';
import CountdownTimer from './CountdownTimer';
import type { SepayQr } from '../../types';

interface SepayQrPanelProps {
  orderId: string;
  onPaid(): void;
  onExpired(): void;
}

/**
 * Builds a scannable VietQR image URL from the SePay transfer fields.
 * Uses vietqr.app per the SePay documentation (requires `bank` param).
 */
function buildQrImageUrl(qr: SepayQr): string {
  const params = new URLSearchParams({
    acc: qr.bankAccount,
    bank: qr.bankId ?? 'MB',
    amount: String(qr.amount),
    des: qr.content,
    template: 'compact',
  });
  return `https://vietqr.app/img?${params.toString()}`;
}

export default function SepayQrPanel({ orderId, onPaid, onExpired }: SepayQrPanelProps) {
  const { t } = useTranslation();
  const [qr, setQr] = useState<SepayQr | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch QR data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    paymentsService
      .getSepayQr(orderId)
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message ?? t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  // SSE — real-time payment notification from backend.
  // Closes on paid, expired, or unmount. Does not close on transient errors
  // because EventSource auto-reconnects; onerror just logs.
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (expired) return; // no point connecting after countdown ends

    const baseURL = import.meta.env.VITE_API_URL ?? '/api';
    const es = new EventSource(`${baseURL}/payments/stream/${orderId}`);

    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as { success?: boolean };
        if (data.success) {
          es.close();
          onPaidRef.current();
        }
      } catch {
        // malformed frame — ignore, stream continues
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically; we just log in dev.
      if (import.meta.env.DEV) {
        console.warn('[SepayQrPanel] SSE connection error, will retry…');
      }
    };

    return () => es.close();
  }, [orderId, expired]);

  const qrImageUrl = useMemo(() => (qr ? buildQrImageUrl(qr) : ''), [qr]);

  const handleExpire = () => {
    setExpired(true);
    onExpired();
  };

  const handleCopy = async () => {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the content is shown on screen for manual copy
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-xl bg-surface-container-lowest p-lg"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !qr) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-lg">
        <p className="body-md text-error">{error ?? t('common.error')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl bg-surface-container-lowest p-lg"
    >
      <div className="flex flex-col items-center gap-md">
        <h2 className="headline-md text-on-surface">{t('payment.scanQr')}</h2>

        <img
          src={qrImageUrl}
          alt={t('payment.scanQr')}
          width={240}
          height={240}
          className="h-60 w-60 rounded-lg border border-outline-variant bg-white"
        />

        <dl className="w-full max-w-sm flex-col gap-sm">
          <div className="flex items-center justify-between border-b border-outline-variant py-2">
            <dt className="body-sm text-on-surface-variant">{t('payment.bankAccount')}</dt>
            <dd className="body-md font-medium text-on-surface">{qr.bankAccount}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-outline-variant py-2">
            <dt className="body-sm text-on-surface-variant">{t('payment.amount')}</dt>
            <dd className="title-md text-primary">{formatPrice(qr.amount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-sm py-2">
            <dt className="body-sm text-on-surface-variant">{t('payment.content')}</dt>
            <dd className="flex items-center gap-2">
              <span className="body-md font-semibold text-on-surface">{qr.content}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="label-sm rounded-md border border-outline-variant px-2 py-1 text-primary transition-colors hover:bg-primary/8"
              >
                {copied ? t('payment.copied') : t('payment.copy')}
              </button>
            </dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-1">
          <p className="body-sm text-on-surface-variant">{t('payment.waiting')}</p>
          <p className="flex items-center gap-2 body-sm text-on-surface-variant">
            <span>{t('payment.expiresIn')}</span>
            <CountdownTimer expiresAt={qr.expiresAt} onExpire={handleExpire} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
