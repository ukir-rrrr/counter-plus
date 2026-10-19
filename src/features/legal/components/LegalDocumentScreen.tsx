import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/features/settings/components/SettingsHeader';

import type { LegalDocument } from '../content';

export function LegalDocumentScreen({
  document,
  testIDPrefix,
}: {
  document: LegalDocument;
  testIDPrefix: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SettingsHeader title={document.title} backTestID={`${testIDPrefix}-back`} />
      <ScrollView
        testID={`${testIDPrefix}-scroll`}
        className="flex-1"
        contentContainerClassName="px-screen pb-8 pt-2"
        keyboardShouldPersistTaps="handled">
        <Text testID={`${testIDPrefix}-title`} className="font-sans-bold text-title text-ink">
          {document.title}
        </Text>
        <Text
          testID={`${testIDPrefix}-updated`}
          className="mt-1 font-sans text-label text-ink-subtle">
          {document.updatedLabel}
        </Text>
        <Text
          testID={`${testIDPrefix}-intro`}
          className="mt-4 font-sans text-body leading-[22px] text-ink">
          {document.intro}
        </Text>
        {document.sections.map((section, index) => (
          <View
            key={section.heading}
            testID={`${testIDPrefix}-section-${index}`}
            className="mt-5">
            <Text className="font-sans-bold text-body-sm text-ink">{section.heading}</Text>
            <Text className="mt-1.5 font-sans text-body-sm leading-[21px] text-ink-muted">
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}
