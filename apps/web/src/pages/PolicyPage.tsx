import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function PolicyPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.policy.eyebrow"
      titleKey="info.policy.title"
      subtitleKey="info.policy.subtitle"
    >
      <InfoSection
        titleKey="info.policy.general.title"
        introKey="info.policy.general.intro"
        itemsKey="info.policy.general.items"
      />
      <InfoSection
        titleKey="info.policy.pricing.title"
        introKey="info.policy.pricing.intro"
        itemsKey="info.policy.pricing.items"
      />
      <InfoSection
        titleKey="info.policy.account.title"
        introKey="info.policy.account.intro"
        itemsKey="info.policy.account.items"
      />
    </InfoPageLayout>
  );
}
