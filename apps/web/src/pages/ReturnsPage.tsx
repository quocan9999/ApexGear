import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.returns.eyebrow"
      titleKey="info.returns.title"
      subtitleKey="info.returns.subtitle"
    >
      <InfoSection
        titleKey="info.returns.eligibility.title"
        introKey="info.returns.eligibility.intro"
        itemsKey="info.returns.eligibility.items"
      />
      <InfoSection
        titleKey="info.returns.process.title"
        introKey="info.returns.process.intro"
        itemsKey="info.returns.process.items"
      />
      <InfoSection
        titleKey="info.returns.refund.title"
        introKey="info.returns.refund.intro"
        itemsKey="info.returns.refund.items"
      />
    </InfoPageLayout>
  );
}
