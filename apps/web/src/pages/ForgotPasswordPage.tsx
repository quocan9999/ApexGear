import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { Button, Input } from '../components/ui';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      <div className="text-center">
        <h1 className="headline-lg text-on-surface">{t('auth.forgotTitle')}</h1>
        <p className="body-sm text-outline mt-2">{t('auth.forgotSubtitle')}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="rounded-lg bg-surface-container-low p-md body-sm text-on-surface">
          {t('auth.forgotSuccess')}
        </div>
      ) : (
        <>
          <Input
            id="email"
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('auth.forgotCta')}
          </Button>
        </>
      )}

      <p className="text-center body-sm text-outline">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.loginCta')}
        </Link>
      </p>
    </form>
  );
}
