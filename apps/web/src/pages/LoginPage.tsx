import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';
import { useCartStore } from '../stores/cart.store';
import { Button, Input } from '../components/ui';
import VerificationResendForm from '../components/auth/VerificationResendForm';
import { validateLoginFields, type AuthFieldErrors } from '../utils/authValidation';

function translateFieldError(error?: string) {
  return error;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const clearFieldError = (field: keyof AuthFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextFieldErrors = validateLoginFields({ email, password }, t);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    try {
      setServerError(null);
      await login({ email: email.trim(), password });
      // Merge the guest (localStorage) cart into the server cart on login.
      // Guard so a merge failure never blocks navigation into the app.
      try {
        await useCartStore.getState().mergeGuestCart();
      } catch {
        // Non-blocking: cart merge failure should not trap the user on login
      }
      navigate(searchParams.get('redirect') || searchParams.get('returnUrl') || '/', {
        replace: true,
      });
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : null;
      setServerError(message === 'Vui lòng xác minh email trước khi đăng nhập' ? t('auth.loginUnverifiedResent') : null);
    }
  };

  const displayError = serverError || error;
  const isUnverifiedError = displayError === t('auth.loginUnverifiedResent') || displayError === t('auth.loginUnverified');
  const resendLoginError = displayError === t('auth.loginUnverified') ? t('auth.loginUnverifiedResent') : displayError;

  return (
    <div className="flex flex-col gap-lg">
      <div className="text-center">
        <h1 className="headline-lg text-on-surface">{t('auth.loginTitle')}</h1>
      </div>

      {displayError && (
        <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container flex flex-col gap-md">
          <div className="text-justify">{resendLoginError}</div>
          {isUnverifiedError && (
            <VerificationResendForm
              initialEmail={email}
              showEmailInput={false}
              compact
              autoSend
              cooldownSeconds={60}
              buttonLabelKey="auth.resendEmail"
            />
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-lg">
        <Input
          id="email"
          label={t('auth.email')}
          type="email"
          value={email}
          error={translateFieldError(fieldErrors.email)}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
            clearError();
            setServerError(null);
          }}
          required
        />
        <Input
          id="password"
          label={t('auth.password')}
          type="password"
          value={password}
          error={translateFieldError(fieldErrors.password)}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
            clearError();
            setServerError(null);
          }}
          required
        />

        <div className="text-right">
          <Link to="/forgot-password" className="body-sm text-primary hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          {t('auth.loginCta')}
        </Button>

        <div className="relative flex items-center gap-md">
          <div className="flex-1 border-t border-outline-variant" />
          <span className="body-sm text-outline">{t('auth.or')}</span>
          <div className="flex-1 border-t border-outline-variant" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = '/api/auth/google';
          }}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t('auth.loginWithGoogle')}
        </Button>

        <p className="text-center body-sm text-outline">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            {t('auth.registerCta')}
          </Link>
        </p>
      </form>
    </div>
  );
}
