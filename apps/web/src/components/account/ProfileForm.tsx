import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import type { User } from '../../types';

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const startEdit = () => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setStatus(null);
    setEditing(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const updated = await authService.updateProfile({ name: name.trim(), phone: phone.trim() });
      useAuthStore.setState({ user: updated });
      setStatus({ type: 'success', message: t('account.profile.success') });
      setEditing(false);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? t('common.error');
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex w-full max-w-md flex-col gap-md"
    >
      {status && (
        <Toast variant={status.type} className="self-start">
          {status.message}
        </Toast>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-md">
          <Input
            id="profile-name"
            label={t('account.profile.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-email" className="label-md text-on-surface-variant">
              {t('account.profile.email')}
            </label>
            <Input id="profile-email" value={user.email} disabled />
          </div>
          <Input
            id="profile-phone"
            label={t('account.profile.phone')}
            value={phone}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex gap-xs">
            <Button type="submit" variant="primary" size="md" isLoading={submitting} className="self-start">
              {t('account.profile.save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="self-start"
              onClick={() => setEditing(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <dl className="flex flex-col gap-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="label-md text-on-surface-variant">{t('account.profile.name')}</dt>
              <dd className="body-md text-on-surface">{user.name}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="label-md text-on-surface-variant">{t('account.profile.email')}</dt>
              <dd className="body-md text-on-surface">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="label-md text-on-surface-variant">{t('account.profile.phone')}</dt>
              <dd className="body-md text-on-surface">
                {user.phone || t('account.profile.noPhone')}
              </dd>
            </div>
          </dl>
          <Button variant="outline" size="md" className="self-start" onClick={startEdit}>
            {t('account.profile.edit')}
          </Button>
        </>
      )}
    </motion.div>
  );
}
