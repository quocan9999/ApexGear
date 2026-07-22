import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';
import { Button, Input } from '../components/ui';
import VerificationResendForm from '../components/auth/VerificationResendForm';
import { validateRegisterFields, type AuthFieldErrors } from '../utils/authValidation';

function translateFieldError(error?: string) {
  return error;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

    const nextFieldErrors = validateRegisterFields({ name, email, password, confirmPassword }, t);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    try {
      setServerError(null);
      await register({ name: name.trim(), email: email.trim(), password });
      setSubmitted(true);
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : null;
      setServerError(message === 'Email already registered' ? t('auth.emailAlreadyRegisteredResent') : null);
    }
  };

  const displayError = serverError || error;
  const isDuplicateEmailError =
    serverError === t('auth.emailAlreadyRegisteredResent') ||
    error === t('auth.emailAlreadyRegisteredResent') ||
    error === t('auth.emailAlreadyRegistered');

  const resendEmailError = displayError === t('auth.emailAlreadyRegistered')
    ? t('auth.emailAlreadyRegisteredResent')
    : displayError;

  return submitted ? (
    <section className="flex flex-col items-center text-center">
      <div className="mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/10 text-primary">
        <svg
          className="h-9 w-9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6h16v12H4z" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      </div>

      <p className="label-md mb-sm text-primary">{t('auth.registerSuccessEyebrow')}</p>
      <h1 className="headline-md mb-md text-on-surface">{t('auth.registerSuccessTitle')}</h1>
      <p className="body-md mb-lg text-on-surface-variant">{t('auth.registerSuccessCopy')}</p>

      <div className="mb-xl w-full rounded-lg bg-surface-container-low p-md text-left">
        <p className="label-sm text-outline">{t('auth.registerSuccessEmailSentTo')}</p>
        <p className="body-md mt-xs break-all font-semibold text-on-surface">{email}</p>
      </div>

      <a
        href="https://mail.google.com"
        target="_blank"
        rel="noreferrer"
        className="mb-md inline-flex h-12 w-full items-center justify-center gap-sm rounded-lg bg-primary px-lg font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-[0.98]"
      >
        {t('auth.openMailboxCta')}
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>

      <div className="w-full">
        <VerificationResendForm initialEmail={email} showEmailInput={false} />
      </div>

      <div className="mt-lg w-full border-t border-outline-variant pt-lg">
        <p className="body-sm text-on-surface-variant">
          {t('auth.registerSuccessHelp')}{' '}
          <a href="mailto:support@apexgear.local" className="font-semibold text-primary hover:underline">
            {t('auth.contactSupportCta')}
          </a>
        </p>
        <p className="mt-md body-sm text-outline">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t('auth.loginCta')}
          </Link>
        </p>
      </div>
    </section>
  ) : (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-lg">
      <div className="text-center">
        <h1 className="headline-lg text-on-surface">{t('auth.registerTitle')}</h1>
      </div>

      {displayError && (
        <div className="flex flex-col gap-md rounded-lg bg-error-container p-md body-sm text-on-error-container">
          <div className="text-justify">{resendEmailError}</div>
          {isDuplicateEmailError && (
            <VerificationResendForm
              initialEmail={email}
              showEmailInput={false}
              compact
              autoSend
              cooldownSeconds={60}
              buttonLabelKey="auth.resendEmail"
              cooldownLabelKey="auth.resendEmailCooldown"
            />
          )}
        </div>
      )}

      <Input
        id="name"
        label={t('auth.name')}
        type="text"
        value={name}
        error={translateFieldError(fieldErrors.name)}
        onChange={(e) => {
          setName(e.target.value);
          clearFieldError('name');
          clearError();
          setServerError(null);
        }}
        required
      />
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
      <Input
        id="confirmPassword"
        label={t('auth.confirmPassword')}
        type="password"
        value={confirmPassword}
        error={translateFieldError(fieldErrors.confirmPassword)}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          clearFieldError('confirmPassword');
          clearError();
          setServerError(null);
        }}
        required
      />

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
        onClick={() => {
          window.location.href = '/api/auth/google';
        }}
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
