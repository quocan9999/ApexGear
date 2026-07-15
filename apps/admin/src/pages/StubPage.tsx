import { useTranslation } from 'react-i18next';

interface StubPageProps {
  page: string;
}

export default function StubPage({ page }: StubPageProps) {
  const { t } = useTranslation();
  const headingId = `${page}-page-title`;

  return (
    <section aria-labelledby={headingId} className="rounded-lg bg-surface-container-lowest p-6 shadow-level-1">
      <h2 id={headingId} className="headline-lg text-on-surface">
        {t(`pages.${page}.title`)}
      </h2>
      <p className="body-md mt-2 text-on-surface-variant">{t(`pages.${page}.description`)}</p>
    </section>
  );
}
