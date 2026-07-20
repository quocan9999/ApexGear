import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { Button, Input } from '../ui';

export default function VerificationResendForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.resendVerification(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return submitted ? (
    <div className="rounded-lg bg-surface-container-low p-md body-sm text-on-surface">
      {t('auth.verificationResent')}
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      <Input
        id="verificationEmail"
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {error && <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">{error}</div>}
      <Button type="submit" isLoading={isLoading} className="w-full">
        {t('auth.resendVerificationCta')}
      </Button>
    </form>
  );
}
