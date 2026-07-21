import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../ui';

export default function VerificationResendForm({
  initialEmail = '',
  showEmailInput = true,
  compact = false,
  autoSend = false,
  cooldownSeconds = 0,
  buttonLabelKey = 'auth.resendVerificationCta',
  cooldownLabelKey = 'auth.resendEmailCooldown',
}: {
  initialEmail?: string;
  showEmailInput?: boolean;
  compact?: boolean;
  autoSend?: boolean;
  cooldownSeconds?: number;
  buttonLabelKey?: string;
  cooldownLabelKey?: string;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownRemaining((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const cooldownLabel = cooldownRemaining > 0 ? t(cooldownLabelKey, { seconds: cooldownRemaining }) : t(buttonLabelKey);

  const sendVerification = useCallback(async () => {
    const targetEmail = showEmailInput ? email : initialEmail;
    if (!targetEmail || cooldownRemaining > 0) return;

    setError(null);
    setIsLoading(true);
    if (cooldownSeconds > 0) {
      setCooldownRemaining(cooldownSeconds);
    }
    try {
      await authService.resendVerification(targetEmail);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [cooldownRemaining, cooldownSeconds, email, initialEmail, showEmailInput, t]);

  useEffect(() => {
    if (!autoSend || autoSentRef.current || !initialEmail) return;

    autoSentRef.current = true;
    void sendVerification();
  }, [autoSend, initialEmail, sendVerification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendVerification();
  };

  if (submitted && !compact) {
    return (
      <div className="rounded-lg bg-surface-container-low p-md body-sm text-on-surface">
        {t('auth.verificationResent')}
      </div>
    );
  }

  const button = (
    <Button
      type={compact ? 'button' : 'submit'}
      isLoading={isLoading}
      size={compact ? 'sm' : 'md'}
      variant={compact ? 'outline' : 'primary'}
      disabled={cooldownRemaining > 0}
      onClick={compact ? sendVerification : undefined}
      className={compact ? 'w-auto bg-surface-container-lowest text-on-error-container hover:bg-error-container/70' : 'w-full'}
    >
      {cooldownLabel}
    </Button>
  );

  if (compact) {
    return (
      <div className="flex flex-col items-start gap-sm">
        {error && <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">{error}</div>}
        {button}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      {showEmailInput && (
        <Input
          id="verificationEmail"
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      )}
      {error && <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">{error}</div>}
      {button}
    </form>
  );
}
