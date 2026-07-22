import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function TermsPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.terms.eyebrow"
      titleKey="info.terms.title"
      subtitleKey="info.terms.subtitle"
    >
      <InfoSection
        titleKey="info.terms.acceptance.title"
        introKey="info.terms.acceptance.intro"
        itemsKey="info.terms.acceptance.items"
      />
      <InfoSection
        titleKey="info.terms.usage.title"
        introKey="info.terms.usage.intro"
        itemsKey="info.terms.usage.items"
      />
      <InfoSection
        titleKey="info.terms.liability.title"
        introKey="info.terms.liability.intro"
        itemsKey="info.terms.liability.items"
      />
    </InfoPageLayout>
  );
}
