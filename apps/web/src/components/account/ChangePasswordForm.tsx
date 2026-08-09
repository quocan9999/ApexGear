import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import { authService } from '../../services/auth.service';

const MIN_LENGTH = 8;

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export default function ChangePasswordForm() {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!currentPassword) next.currentPassword = t('account.password.required');
    if (newPassword.length < MIN_LENGTH) next.newPassword = t('account.password.tooShort');
    if (confirmNewPassword !== newPassword) next.confirmNewPassword = t('account.password.mismatch');
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setStatus({ type: 'success', message: t('account.password.success') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      const message = (err as { message?: string })?.message ?? t('common.error');
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full max-w-md flex-col gap-md"
    >
      <Input
        id="current-password"
        type={showCurrentPassword ? 'text' : 'password'}
        autoComplete="current-password"
        label={t('account.password.current')}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={errors.currentPassword}
        endAdornment={
          <button
            type="button"
            className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showCurrentPassword ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
            onClick={() => setShowCurrentPassword((visible) => !visible)}
            disabled={submitting}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {showCurrentPassword ? (
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
        id="new-password"
        type={showNewPassword ? 'text' : 'password'}
        autoComplete="new-password"
        label={t('account.password.new')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
        endAdornment={
          <button
            type="button"
            className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showNewPassword ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
            onClick={() => setShowNewPassword((visible) => !visible)}
            disabled={submitting}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {showNewPassword ? (
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
        id="confirm-new-password"
        type={showConfirmNewPassword ? 'text' : 'password'}
        autoComplete="new-password"
        label={t('account.password.confirm')}
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        error={errors.confirmNewPassword}
        endAdornment={
          <button
            type="button"
            className="rounded p-2 text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showConfirmNewPassword ? t('auth.hidePassword', 'Ẩn mật khẩu') : t('auth.showPassword', 'Hiện mật khẩu')}
            onClick={() => setShowConfirmNewPassword((visible) => !visible)}
            disabled={submitting}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {showConfirmNewPassword ? (
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

      {status && (
        <Toast variant={status.type} className="self-start">
          {status.message}
        </Toast>
      )}

      <Button type="submit" variant="primary" size="md" isLoading={submitting} className="self-start">
        {t('account.password.submit')}
      </Button>
    </motion.form>
  );
}
