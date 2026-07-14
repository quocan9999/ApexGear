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
      className="flex max-w-md flex-col gap-md"
    >
      <Input
        id="current-password"
        type="password"
        autoComplete="current-password"
        label={t('account.password.current')}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={errors.currentPassword}
      />
      <Input
        id="new-password"
        type="password"
        autoComplete="new-password"
        label={t('account.password.new')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
      />
      <Input
        id="confirm-new-password"
        type="password"
        autoComplete="new-password"
        label={t('account.password.confirm')}
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        error={errors.confirmNewPassword}
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
