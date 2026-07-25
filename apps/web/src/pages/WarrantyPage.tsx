import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function WarrantyPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.warranty.eyebrow"
      titleKey="info.warranty.title"
      subtitleKey="info.warranty.subtitle"
    >
      <InfoSection
        titleKey="info.warranty.terms.title"
        introKey="info.warranty.terms.intro"
        itemsKey="info.warranty.terms.items"
      />
      <InfoSection
        titleKey="info.warranty.exclusions.title"
        introKey="info.warranty.exclusions.intro"
        itemsKey="info.warranty.exclusions.items"
      />
      <InfoSection
        titleKey="info.warranty.process.title"
        introKey="info.warranty.process.intro"
        itemsKey="info.warranty.process.items"
      />
    </InfoPageLayout>
  );
}
