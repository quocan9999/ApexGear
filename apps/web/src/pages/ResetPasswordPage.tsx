import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { Button, Input } from '../components/ui';

function passwordMeetsRequirements(pwd: string): boolean {
  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t('auth.resetMissingToken'));
      return;
    }
    if (!passwordMeetsRequirements(newPassword)) {
      setError(t('auth.passwordRequirements'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSubmitted(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err: any) {
      setError(err?.message ?? t('common.error'));
    } finally {
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
      <div className="text-center">
        <h1 className="headline-lg text-on-surface">{t('auth.resetTitle')}</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container p-md body-sm text-on-error-container">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="rounded-lg bg-surface-container-low p-md body-sm text-on-surface">
          {t('auth.resetSuccess')}
        </div>
      ) : (
        <>
          <Input
            id="newPassword"
            label={t('auth.newPassword')}
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            endAdornment={
              <button
                type="button"
                className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showPassword ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={isLoading}
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
          />
          <Input
            id="confirmPassword"
            label={t('auth.confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            endAdornment={
              <button
                type="button"
                className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showConfirmPassword ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                disabled={isLoading}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  {showConfirmPassword ? (
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
          />
          <p className="body-sm text-outline">{t('auth.passwordRequirements')}</p>
          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('auth.resetCta')}
          </Button>
        </>
      )}

      <p className="text-center body-sm text-outline">
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.loginCta')}
        </Link>
      </p>
    </form>
  );
}
