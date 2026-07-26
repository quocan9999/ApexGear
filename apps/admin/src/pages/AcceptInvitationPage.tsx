import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';
import { authService } from '../services/auth.service';

export default function AcceptInvitationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationPassword, setShowConfirmationPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError(t('invitation.invalidToken'));
      return;
    }
    if (password !== confirmation) {
      setError(t('invitation.passwordMismatch'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await authService.acceptInvitation(token, password);
      setSuccess(true);
    } catch (err) {
      const candidate = err as { message?: unknown; rawMessage?: unknown } | null;
      const message = typeof candidate?.rawMessage === 'string'
        ? candidate.rawMessage
        : typeof candidate?.message === 'string'
          ? candidate.message
          : null;
      setError(message === 'Invalid or expired invitation'
        ? t('invitation.invalidToken')
        : t('invitation.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-on-surface sm:px-6">
      <main className="w-full max-w-md rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
        <header className="mb-6 text-center">
          <h1 className="headline-lg mb-2 text-primary">{t('invitation.title')}</h1>
          <p className="body-md text-on-surface-variant">{t('invitation.description')}</p>
        </header>

        {success ? (
          <div className="flex flex-col gap-md">
            <p className="body-md rounded bg-success-container p-4 text-on-success-container" role="status">
              {t('invitation.success')}
            </p>
            <Button type="button" onClick={() => navigate('/login', { replace: true })}>
              {t('invitation.goToLogin')}
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-md" onSubmit={(event) => void submit(event)}>
            {error && <p className="body-sm rounded bg-error-container p-4 text-on-error-container" role="alert">{error}</p>}
            <Input
              label={t('invitation.password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              endAdornment={
                <button
                  type="button"
                  className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={submitting}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 9 4 10 8a12 12 0 0 1-2.1 4.1M6.6 6.6A11.8 11.8 0 0 0 2 12c1 4 5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </>
                    )}
                  </svg>
                </button>
              }
              required
              disabled={submitting}
            />
            <Input
              label={t('invitation.confirmPassword')}
              type={showConfirmationPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              endAdornment={
                <button
                  type="button"
                  className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showConfirmationPassword ? t('login.hidePassword') : t('login.showPassword')}
                  onClick={() => setShowConfirmationPassword((visible) => !visible)}
                  disabled={submitting}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmationPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 9 4 10 8a12 12 0 0 1-2.1 4.1M6.6 6.6A11.8 11.8 0 0 0 2 12c1 4 5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </>
                    )}
                  </svg>
                </button>
              }
              required
              disabled={submitting}
            />
            <Button type="submit" isLoading={submitting} loadingLabel={t('common.loading')}>
              {t('invitation.submit')}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
