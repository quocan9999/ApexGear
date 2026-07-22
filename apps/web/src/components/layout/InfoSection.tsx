import { useTranslation } from 'react-i18next';

interface InfoSectionProps {
  titleKey: string;
  introKey: string;
  itemsKey: string;
  /** Optional id used as anchor target for in-page navigation. */
  id?: string;
}

/**
 * A single structured section inside an info/legal page: heading, intro
 * paragraph, and a bulleted list of items. All content comes from i18n keys.
 */
export default function InfoSection({
  titleKey,
  introKey,
  itemsKey,
  id,
}: InfoSectionProps) {
  const { t } = useTranslation();
  const items = t(itemsKey, { returnObjects: true }) as string[];

  return (
    <section id={id} className="mb-xl last:mb-0">
      <h2 className="headline-md text-on-surface">{t(titleKey)}</h2>
      <p className="mt-sm body-md text-on-surface-variant">{t(introKey)}</p>
      <ul className="mt-md flex flex-col gap-sm">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex gap-sm body-md text-on-surface-variant"
          >
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
