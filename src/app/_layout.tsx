import '../global.css';

// フォントは使う太さだけを読み込む（パッケージの index から読むと全ての太さがアプリに入る）
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { IBMPlexSansJP_400Regular } from '@expo-google-fonts/ibm-plex-sans-jp/400Regular';
import { IBMPlexSansJP_500Medium } from '@expo-google-fonts/ibm-plex-sans-jp/500Medium';
import { IBMPlexSansJP_700Bold } from '@expo-google-fonts/ibm-plex-sans-jp/700Bold';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, type ColorScheme } from '@/constants/theme';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { ensureDefaultCategory } from '@/features/categories/repository';
import { useSettingsStore } from '@/features/settings/store';
import { useHideDevToolsFabOnModals } from '@/lib/devToolsFab';
import { initAnalytics } from '@/lib/analytics';
import { hydrateCachedEntitlement, initPurchases } from '@/lib/purchases';

SplashScreen.preventAutoHideAsync();

function DevToolsFabGate() {
  useHideDevToolsFabOnModals();
  return null;
}

function navigationTheme(scheme: ColorScheme): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.surface,
      text: c.ink,
      border: c.border,
    },
  };
}

export default function RootLayout() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansJP_400Regular,
    IBMPlexSansJP_500Medium,
    IBMPlexSansJP_700Bold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const migration = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error>();

  useEffect(() => {
    if (!migration.success) return;
    Promise.all([ensureDefaultCategory(), useSettingsStore.getState().load()])
      .then(() => {
        hydrateCachedEntitlement();
        setSeeded(true);
        void initPurchases();
        void initAnalytics();
      })
      .catch((e: unknown) => setSeedError(e instanceof Error ? e : new Error(String(e))));
  }, [migration.success]);

  const error = migration.error ?? fontError ?? seedError;
  const ready = (fontsLoaded && seeded) || error != null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (error) {
    const c = colors[scheme];
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: c.background }}>
        <Text style={{ color: c.ink, textAlign: 'center' }}>
          {`起動できませんでした。アプリを再起動してください。\n${error.message}`}
        </Text>
      </View>
    );
  }
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme(scheme)}>
        <DevToolsFabGate />
        <Stack>
          {/* 編集シート：透明なモーダルの上に @gorhom/bottom-sheet を出す */}
          <Stack.Screen
            name="counter/[id]"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
