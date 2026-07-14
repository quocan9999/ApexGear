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
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            id="confirmPassword"
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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
