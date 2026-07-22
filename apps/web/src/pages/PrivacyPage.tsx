import InfoPageLayout from '../components/layout/InfoPageLayout';
import InfoSection from '../components/layout/InfoSection';

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrowKey="info.privacy.eyebrow"
      titleKey="info.privacy.title"
      subtitleKey="info.privacy.subtitle"
    >
      <InfoSection
        titleKey="info.privacy.collection.title"
        introKey="info.privacy.collection.intro"
        itemsKey="info.privacy.collection.items"
      />
      <InfoSection
        titleKey="info.privacy.usage.title"
        introKey="info.privacy.usage.intro"
        itemsKey="info.privacy.usage.items"
      />
      <InfoSection
        titleKey="info.privacy.sharing.title"
        introKey="info.privacy.sharing.intro"
        itemsKey="info.privacy.sharing.items"
      />
      <InfoSection
        titleKey="info.privacy.rights.title"
        introKey="info.privacy.rights.intro"
        itemsKey="info.privacy.rights.items"
      />
    </InfoPageLayout>
  );
}
