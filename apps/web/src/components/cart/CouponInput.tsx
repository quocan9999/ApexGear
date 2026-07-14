import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { couponsService } from '../../services/coupons.service';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { CouponValidation } from '../../types';

interface CouponInputProps {
  subtotal: number;
  onApplied: (result: CouponValidation) => void;
  onCleared: () => void;
  disabledReason?: string;
}

export default function CouponInput({
  subtotal,
  onApplied,
  onCleared,
  disabledReason,
}: CouponInputProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<CouponValidation | null>(null);

  const isDisabled = Boolean(disabledReason);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await couponsService.validate(trimmed, subtotal);
      if (result.valid) {
        setApplied(result);
        onApplied(result);
      } else {
        setApplied(null);
        setError(result.message || t('cart.coupon.invalid'));
      }
    } catch {
      setApplied(null);
      setError(t('cart.coupon.invalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setApplied(null);
    setError(null);
    setCode('');
    onCleared();
  };

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-start gap-sm">
        <div className="flex-1">
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('cart.coupon.placeholder')}
            disabled={isDisabled || loading || Boolean(applied)}
            aria-label={t('cart.coupon.placeholder')}
          />
        </div>
        {applied ? (
          <Button type="button" variant="outline" size="md" onClick={handleClear} disabled={isDisabled}>
            {t('cart.remove')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleApply}
            isLoading={loading}
            disabled={isDisabled || loading || !code.trim()}
          >
            {t('cart.coupon.apply')}
          </Button>
        )}
      </div>

      {disabledReason && (
        <p className="body-sm text-on-surface-variant">{disabledReason}</p>
      )}

      {applied && (
        <p className={cn('body-sm text-green-600')}>
          {t('cart.coupon.applied', { code: applied.code ?? code.trim().toUpperCase() })}
        </p>
      )}

      {error && <p className="body-sm text-error">{error}</p>}
    </div>
  );
}
