import { Stack } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProBanner } from '@/features/purchases/components/ProBanner';
import {
  openLegalScreen,
  openSupportLink,
  restorePurchases,
  type SettingsActionResult,
} from '@/features/settings/actions';
import { SettingsHeader } from '@/features/settings/components/SettingsHeader';
import { SettingsLinkRow } from '@/features/settings/components/SettingsLinkRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsToggle } from '@/features/settings/components/SettingsToggle';
import { useSettingsStore } from '@/features/settings/store';
import { getAppVersion } from '@/features/settings/version';
import { tapHaptic } from '@/lib/haptics';
import { RESTORE_NONE_MESSAGE, RESTORE_OK_MESSAGE } from '@/lib/purchases';

function showSupportResult(result: SettingsActionResult): void {
  if (result.ok || result.reason === 'busy') return;
  Alert.alert('開けません', result.message ?? 'リンクを開けませんでした。');
}

function showRestoreResult(result: SettingsActionResult): void {
  if (result.ok) {
    Alert.alert(result.isPro ? RESTORE_OK_MESSAGE : RESTORE_NONE_MESSAGE);
    return;
  }
  if (result.reason === 'busy' || result.reason === 'cancelled') return;
  Alert.alert('購入を復元できません', result.message ?? '開発ビルドでのみ利用できます');
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useSettingsStore((s) => s.haptics);
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const setKeepAwake = useSettingsStore((s) => s.setKeepAwake);
  const error = useSettingsStore((s) => s.error);
  const version = getAppVersion();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SettingsHeader />
      <ScrollView
        testID="settings-scroll"
        className="flex-1"
        contentContainerClassName="pb-4 pt-1"
        keyboardShouldPersistTaps="handled">
        {error ? (
          <Text
            testID="settings-error"
            className="mx-screen mb-2 text-center font-sans text-label text-danger">
            {error}
          </Text>
        ) : null}
        <ProBanner />
        <SettingsSection title="カウント">
          <SettingsToggle
            testID="settings-toggle-haptics"
            label="タップ時の振動"
            description="＋・−を押したときに軽く振動"
            value={haptics}
            onValueChange={(next) => {
              setHaptics(next);
              tapHaptic();
            }}
          />
          <SettingsToggle
            testID="settings-toggle-keep-awake"
            label="画面を消さない"
            description="数えている間は画面を点けたまま"
            value={keepAwake}
            onValueChange={(next) => {
              setKeepAwake(next);
              tapHaptic();
            }}
            last
          />
        </SettingsSection>

        <SettingsSection title="購入">
          <SettingsLinkRow
            testID="settings-restore"
            label="購入を復元"
            accent
            last
            onPress={() => {
              void restorePurchases().then(showRestoreResult);
            }}
          />
        </SettingsSection>

        <SettingsSection title="サポート">
          <SettingsLinkRow
            testID="settings-review"
            label="App Storeでレビューを書く"
            showChevron
            onPress={() => {
              void openSupportLink('review').then(showSupportResult);
            }}
          />
          <SettingsLinkRow
            testID="settings-contact"
            label="お問い合わせ"
            showChevron
            onPress={() => {
              void openSupportLink('contact').then(showSupportResult);
            }}
          />
          <SettingsLinkRow
            testID="settings-terms"
            label="利用規約"
            showChevron
            onPress={() => {
              showSupportResult(openLegalScreen('terms'));
            }}
          />
          <SettingsLinkRow
            testID="settings-privacy"
            label="プライバシーポリシー"
            showChevron
            last
            onPress={() => {
              showSupportResult(openLegalScreen('privacy'));
            }}
          />
        </SettingsSection>

        <Text
          testID="settings-version"
          className="px-screen pt-1 text-center font-sans text-label text-ink-subtle">
          {`カウンター＋ バージョン ${version}`}
        </Text>
      </ScrollView>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}
