import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { isStaffRole } from '../routes/RoleRoute';
import { useAuthStore } from '../stores/auth.store';

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}

function errorMessage(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
  return null;
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="10" width="14" height="10" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const storeLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const busy = storeLoading || submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || busy) return;

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    clearError();

    try {
      const loggedInUser = await login({ email, password });
      if (!isStaffRole(loggedInUser.role)) {
        await logout();
        setFormError(t('login.unauthorized'));
        return;
      }
      navigate(safeRedirect(searchParams.get('redirect')), { replace: true });
    } catch (error) {
      setFormError(
        useAuthStore.getState().error || errorMessage(error) || t('login.genericError'),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <header className="mb-6 text-center">
            <h1 className="headline-lg mb-2 text-primary">{t('admin.title')}</h1>
            <p className="body-md text-on-surface-variant">{t('login.description')}</p>
          </header>

          <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
            {formError && (
              <div
                role="alert"
                className="body-sm mb-4 rounded bg-error-container p-4 font-medium text-on-error-container"
              >
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                label={t('login.email')}
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                startAdornment={<MailIcon />}
                disabled={busy}
                required
              />

              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                label={t('login.password')}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                startAdornment={<LockIcon />}
                endAdornment={
                  <button
                    type="button"
                    className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={busy}
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
                disabled={busy}
                required
                minLength={8}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={busy}
                loadingLabel={submitting ? t('login.submitting') : t('common.loading')}
                disabled={busy}
              >
                {t('login.submit')}
              </Button>
            </form>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant px-6 py-4 text-center">
        <p className="body-sm text-secondary">{t('login.copyright')}</p>
      </footer>
    </div>
  );
}
