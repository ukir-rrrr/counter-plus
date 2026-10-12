import { Stack } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openSupportLink, restorePurchases, type SettingsActionResult } from '@/features/settings/actions';
import { SettingsHeader } from '@/features/settings/components/SettingsHeader';
import { SettingsLinkRow } from '@/features/settings/components/SettingsLinkRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsToggle } from '@/features/settings/components/SettingsToggle';
import { useSettingsStore } from '@/features/settings/store';
import { getAppVersion } from '@/features/settings/version';
import { tapHaptic } from '@/lib/haptics';

function showActionResult(result: SettingsActionResult): void {
  if (result.ok || result.reason === 'busy') return;
  Alert.alert('準備中', result.message ?? 'この機能は準備中です。');
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useSettingsStore((s) => s.haptics);
  const sound = useSettingsStore((s) => s.sound);
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const setSound = useSettingsStore((s) => s.setSound);
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
        {/* Pro案内と実リンクはステップ7・9。ここでは出さない */}
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
            testID="settings-toggle-sound"
            label="タップ音"
            description="静かな場所ではオフがおすすめ"
            value={sound}
            onValueChange={(next) => {
              setSound(next);
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
              void restorePurchases().then(showActionResult);
            }}
          />
        </SettingsSection>

        <SettingsSection title="サポート">
          <SettingsLinkRow
            testID="settings-review"
            label="App Storeでレビューを書く"
            showChevron
            onPress={() => {
              void openSupportLink('review').then(showActionResult);
            }}
          />
          <SettingsLinkRow
            testID="settings-contact"
            label="お問い合わせ"
            showChevron
            onPress={() => {
              void openSupportLink('contact').then(showActionResult);
            }}
          />
          <SettingsLinkRow
            testID="settings-terms"
            label="利用規約"
            showChevron
            onPress={() => {
              void openSupportLink('terms').then(showActionResult);
            }}
          />
          <SettingsLinkRow
            testID="settings-privacy"
            label="プライバシーポリシー"
            showChevron
            last
            onPress={() => {
              void openSupportLink('privacy').then(showActionResult);
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
