import { router, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager, Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { createTransitionNavGate } from '@/lib/transitionNav';

const TRANSITION_FALLBACK_MS = 400;

export function SettingsHeader() {
  const c = useThemeColors();
  const navigation = useNavigation();
  const gateRef = useRef(createTransitionNavGate());

  useEffect(() => {
    const gate = gateRef.current;
    const handle = InteractionManager.runAfterInteractions(() => {
      gate.markReady();
    });
    const timer = setTimeout(() => gate.markReady(), TRANSITION_FALLBACK_MS);
    return () => {
      handle.cancel();
      clearTimeout(timer);
    };
  }, []);

  const goBack = () => {
    gateRef.current.request(() => {
      if (navigation.canGoBack()) navigation.goBack();
      else router.replace('/');
    });
  };

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        testID="settings-back"
        accessibilityRole="button"
        accessibilityLabel="戻る"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <ChevronLeftIcon color={c.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
        設定
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}
