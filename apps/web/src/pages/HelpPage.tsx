import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function HelpPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.help.eyebrow"
      titleKey="info.help.title"
      subtitleKey="info.help.subtitle"
    >
      <InfoSection
        titleKey="info.help.ordering.title"
        introKey="info.help.ordering.intro"
        itemsKey="info.help.ordering.items"
      />
      <InfoSection
        titleKey="info.help.shipping.title"
        introKey="info.help.shipping.intro"
        itemsKey="info.help.shipping.items"
      />
      <InfoSection
        titleKey="info.help.returns.title"
        introKey="info.help.returns.intro"
        itemsKey="info.help.returns.items"
      />
      <InfoSection
        titleKey="info.help.warranty.title"
        introKey="info.help.warranty.intro"
        itemsKey="info.help.warranty.items"
      />
      <InfoSection
        titleKey="info.help.contact.title"
        introKey="info.help.contact.intro"
        itemsKey="info.help.contact.items"
      />
    </InfoPageLayout>
  );
}
