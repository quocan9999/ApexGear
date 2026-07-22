import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface InfoPageLayoutProps {
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  children: ReactNode;
}

/**
 * Shared layout for customer-facing info/legal pages.
 *
 * Hero band sits on the page surface so the legal text below reads on the same
 * canvas. The contact CTA at the bottom matches the Lumina Tech / Stitch
 * reference: white card with the same subtle shadow used for product cards,
 * on the same surface background.
 */
export default function InfoPageLayout({
  eyebrowKey,
  titleKey,
  subtitleKey,
  children,
}: InfoPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface">
      {/* Hero band */}
      <section className="border-b border-outline-variant bg-surface py-xl">
        <div className="mx-auto w-full max-w-[1280px] px-md sm:px-lg">
          <span className="label-md text-primary">{t(eyebrowKey)}</span>
          <h1 className="mt-sm headline-xl text-on-surface">{t(titleKey)}</h1>
          <p className="mt-md max-w-[65ch] body-lg text-on-surface-variant">
            {t(subtitleKey)}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-xl">
        <div className="mx-auto w-full max-w-[1280px] px-md sm:px-lg">
          <div className="max-w-[800px]">{children}</div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="pb-xxl">
        <div className="mx-auto w-full max-w-[1280px] px-md sm:px-lg">
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-[var(--shadow-level-1)]">
            <h2 className="headline-md text-on-surface">
              {t('info.common.contactTitle')}
            </h2>
            <p className="mt-sm body-md text-on-surface-variant">
              {t('info.common.contactSubtitle')}
            </p>
            <dl className="mt-md grid grid-cols-1 gap-md sm:grid-cols-3">
              <div>
                <dt className="label-sm text-on-surface-variant">
                  {t('info.common.contactEmailLabel')}
                </dt>
                <dd className="mt-xs body-md text-on-surface">
                  <a
                    href="mailto:support@apexgear.vn"
                    className="hover:text-primary"
                  >
                    support@apexgear.vn
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label-sm text-on-surface-variant">
                  {t('info.common.contactPhoneLabel')}
                </dt>
                <dd className="mt-xs body-md text-on-surface">
                  <a href="tel:+8419000000" className="hover:text-primary">
                    1900 0000
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label-sm text-on-surface-variant">
                  {t('info.common.contactHoursLabel')}
                </dt>
                <dd className="mt-xs body-md text-on-surface">
                  {t('info.common.contactHoursValue')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
