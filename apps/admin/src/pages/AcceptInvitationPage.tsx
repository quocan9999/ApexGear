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
      setError(err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message)
        : t('invitation.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-on-surface sm:px-6">
      <main className="w-full max-w-md rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
        <h1 className="headline-lg mb-2 text-primary">{t('invitation.title')}</h1>
        <p className="body-md mb-6 text-on-surface-variant">{t('invitation.description')}</p>

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
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label={t('invitation.confirmPassword')}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
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
