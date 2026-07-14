import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import ProfileForm from '../components/account/ProfileForm';
import ChangePasswordForm from '../components/account/ChangePasswordForm';
import AddressBook from '../components/account/AddressBook';

type TabKey = 'profile' | 'password' | 'addresses';

const TABS: TabKey[] = ['profile', 'password', 'addresses'];

export default function AccountPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [active, setActive] = useState<TabKey>('profile');

  const tabBase = 'shrink-0 rounded-full px-md py-xs body-sm font-medium transition-colors border';
  const tabIdle =
    'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low';
  const tabActive = 'border-primary bg-primary text-on-primary';

  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      <h1 className="headline-md text-on-surface">{t('account.title')}</h1>

      <div
        className="mt-md flex gap-xs overflow-x-auto pb-xs"
        role="tablist"
        aria-label={t('account.title')}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={cn(tabBase, active === tab ? tabActive : tabIdle)}
          >
            {t(`account.tabs.${tab}`)}
          </button>
        ))}
      </div>

      <motion.section
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mt-lg rounded-xl bg-surface-container-lowest p-lg"
        aria-live="polite"
      >
        {active === 'profile' && user && <ProfileForm user={user} />}
        {active === 'password' && <ChangePasswordForm />}
        {active === 'addresses' && <AddressBook />}
      </motion.section>
    </div>
  );
}
