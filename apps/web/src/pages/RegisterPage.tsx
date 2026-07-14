import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';
import { useCartStore } from '../stores/cart.store';
import { Button, Input } from '../components/ui';

function passwordMeetsRequirements(pwd: string): boolean {
  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!passwordMeetsRequirements(password)) {
      setValidationError(t('auth.passwordRequirements'));
      return;
    }
    if (password !== confirmPassword) {
      setValidationError(t('auth.passwordMismatch'));
      return;
    }

    try {
      await register({ name, email, password });
      // Register auto-logs-in; merge the guest cart into the server cart.
      // Guard so a merge failure never blocks navigation into the app.
      try {
        await useCartStore.getState().mergeGuestCart();
      } catch {
        // Non-blocking
      }
      navigate(searchParams.get('redirect') || searchParams.get('returnUrl') || '/', {
        replace: true,
      });
    } catch {
      // Error handled by store
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      <div className="text-center">
        <h1 className="headline-lg text-on-surface">{t('auth.registerTitle')}</h1>
      </div>

      {displayError && (
        <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">
          {displayError}
        </div>
      )}

      <Input
        id="name"
        label={t('auth.name')}
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); clearError(); }}
        required
      />
      <Input
        id="email"
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); clearError(); }}
        required
      />
      <Input
        id="password"
        label={t('auth.password')}
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); clearError(); }}
        required
      />
      <Input
        id="confirmPassword"
        label={t('auth.confirmPassword')}
        type="password"
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
        required
      />

      <p className="body-sm text-outline">{t('auth.passwordRequirements')}</p>

      <Button type="submit" isLoading={isLoading} className="w-full">
        {t('auth.registerCta')}
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
        onClick={() => { window.location.href = '/api/auth/google'; }}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        {t('auth.loginWithGoogle')}
      </Button>

      <p className="text-center body-sm text-outline">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.loginCta')}
        </Link>
      </p>
    </form>
  );
}
