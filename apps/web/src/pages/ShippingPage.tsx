import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function ShippingPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.shipping.eyebrow"
      titleKey="info.shipping.title"
      subtitleKey="info.shipping.subtitle"
    >
      <InfoSection
        titleKey="info.shipping.regions.title"
        introKey="info.shipping.regions.intro"
        itemsKey="info.shipping.regions.items"
      />
      <InfoSection
        titleKey="info.shipping.fees.title"
        introKey="info.shipping.fees.intro"
        itemsKey="info.shipping.fees.items"
      />
      <InfoSection
        titleKey="info.shipping.tracking.title"
        introKey="info.shipping.tracking.intro"
        itemsKey="info.shipping.tracking.items"
      />
    </InfoPageLayout>
  );
}
