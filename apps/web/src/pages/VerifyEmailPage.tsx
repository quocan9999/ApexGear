import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import VerificationResendForm from '../components/auth/VerificationResendForm';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;

    (async () => {
      try {
        await authService.verifyEmail(token);
        if (alive) setStatus('success');
      } catch (err: unknown) {
        if (alive) {
          const message = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
            ? err.message
            : t('common.error');
          setError(message === 'Invalid or expired verification token' ? t('auth.verifyEmailMissingToken') : message);
          setStatus('error');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [t, token]);

  if (!token) {
    return (
      <div className="flex flex-col gap-lg">
        <h1 className="headline-lg text-on-surface">{t('auth.verifyEmailTitle')}</h1>
        <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">
          {t('auth.verifyEmailMissingToken')}
        </div>
        <VerificationResendForm />
        <p className="text-center body-sm text-outline">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t('auth.loginCta')}
          </Link>
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-lg">
        <h1 className="headline-lg text-on-surface">{t('auth.verifyEmailTitle')}</h1>
        <div className="body-md text-on-surface">{t('auth.verifyEmailLoading')}</div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-lg">
        <h1 className="headline-lg text-on-surface">{t('auth.verifyEmailTitle')}</h1>
        <div className="rounded-lg bg-surface-container-low p-md body-sm text-on-surface">
          {t('auth.verifyEmailSuccess')}
        </div>
        <p className="text-center body-sm text-outline">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t('auth.loginCta')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <h1 className="headline-lg text-on-surface">{t('auth.verifyEmailTitle')}</h1>
      {error && <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">{error}</div>}
      <VerificationResendForm />
      <p className="text-center body-sm text-outline">
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.loginCta')}
        </Link>
      </p>
    </div>
  );
}
