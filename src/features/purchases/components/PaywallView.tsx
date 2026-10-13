import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ClockIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { openSupportLink } from '@/features/settings/actions';
import { countHistoryEvents } from '@/features/history/repository';
import {
  DEV_BUILD_ONLY_MESSAGE,
  destinationAfterPurchase,
  parseOpenedFrom,
  PRICE_UNAVAILABLE_MESSAGE,
  purchasePro,
  RESTORE_NONE_MESSAGE,
  RESTORE_OK_MESSAGE,
  restorePurchases,
  useIsPro,
  usePurchasesStore,
  type PaywallOpenedFrom,
  type PurchaseResult,
} from '@/lib/purchases';

import { isBenefitHighlighted, PAYWALL_BENEFITS, paywallBenefitTestId } from '../benefits';
import { PAYWALL_TITLE_STYLE, paywallFooterBottom, paywallTopInset } from '../paywallLayout';

function showPurchaseResult(result: PurchaseResult, kind: 'buy' | 'restore'): void {
  if (result.ok) {
    if (kind === 'restore') {
      Alert.alert(result.isPro ? RESTORE_OK_MESSAGE : RESTORE_NONE_MESSAGE);
    }
    return;
  }
  if (result.reason === 'busy' || result.reason === 'cancelled') return;
  const title = kind === 'restore' ? '購入を復元できません' : '購入できません';
  Alert.alert(title, result.message ?? DEV_BUILD_ONLY_MESSAGE);
}

function closePaywall(openedFrom: PaywallOpenedFrom, purchased: boolean): void {
  if (purchased) {
    const dest = destinationAfterPurchase(openedFrom);
    if (dest) {
      router.replace(dest);
      return;
    }
  }
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function PaywallView({ openedFrom: openedFromParam }: { openedFrom?: string | string[] }) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const openedFrom = parseOpenedFrom(openedFromParam);
  const isPro = useIsPro();
  const available = usePurchasesStore((s) => s.available);
  const priceString = usePurchasesStore((s) => s.priceString);
  const offeringsEmpty = usePurchasesStore((s) => s.offeringsEmpty);
  const offeringsError = usePurchasesStore((s) => s.offeringsError);
  const purchaseInFlight = usePurchasesStore((s) => s.purchaseInFlight);
  const [historyCount] = useState(() => {
    try {
      return countHistoryEvents();
    } catch {
      return 0;
    }
  });

  const handleBuy = () => {
    void purchasePro().then((result) => showPurchaseResult(result, 'buy'));
  };

  const handleRestore = () => {
    void restorePurchases().then((result) => showPurchaseResult(result, 'restore'));
  };

  const buyDisabled = purchaseInFlight || !available || offeringsEmpty || !priceString;
  const buyLabel = purchaseInFlight
    ? '処理中…'
    : priceString
      ? `${priceString}でProにする`
      : 'Proにする';

  return (
    <View className="flex-1 bg-background">
      <View
        testID="paywall-header"
        className="z-10 shrink-0 flex-row items-center justify-between bg-background px-2.5 pb-3"
        style={{ paddingTop: paywallTopInset(insets.top) }}>
        <Pressable
          testID="paywall-close"
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          onPress={() => closePaywall(openedFrom, isPro)}
          className="h-11 w-11 items-center justify-center rounded-full bg-neutral-button active:opacity-70">
          <CloseIcon color={c.ink} size={18} />
        </Pressable>
        <Pressable
          testID="paywall-restore"
          accessibilityRole="button"
          accessibilityLabel="購入を復元"
          disabled={purchaseInFlight}
          onPress={handleRestore}
          className="h-11 min-w-11 items-center justify-center px-2 active:opacity-70">
          <Text className="font-sans-medium text-body-sm text-ink-muted">購入を復元</Text>
        </Pressable>
      </View>

      <ScrollView
        testID="paywall-scroll"
        className="flex-1"
        contentContainerClassName="gap-3.5 px-5 pb-4 pt-1"
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-start gap-3.5">
          <View className="mt-1 h-[60px] w-[60px] shrink-0 items-center justify-center rounded-card bg-accent">
            <PlusIcon color={c.onAccent} size={30} strokeWidth={2.6} />
          </View>
          <View className="min-w-0 flex-1 justify-center" style={{ minHeight: 60, paddingTop: 2 }}>
            <Text
              testID="paywall-title"
              className="font-sans-bold text-ink"
              style={PAYWALL_TITLE_STYLE}>
              カウンター＋ Pro
            </Text>
            <Text testID="paywall-subtitle" className="mt-1 font-sans text-body-sm leading-5 text-ink-muted">
              棚卸しの「最後の転記」までラクにする
            </Text>
          </View>
        </View>

        {!isPro ? (
          <View
            testID="paywall-history-teaser"
            className="flex-row items-center gap-2.5 rounded-[14px] bg-accent-soft px-3.5 py-3">
            <ClockIcon color={c.accentInk} size={20} />
            <Text className="min-w-0 flex-1 font-sans text-body-sm leading-5 text-accent-ink">
              これまでの履歴{' '}
              <Text testID="paywall-history-count" className="font-mono-medium">
                {historyCount}
              </Text>{' '}
              件を記録中です。購入すると、すぐに見られます。
            </Text>
          </View>
        ) : null}

        <View className="overflow-hidden rounded-card border border-border bg-surface py-1">
          {PAYWALL_BENEFITS.map((benefit) => {
            const hot = isBenefitHighlighted(benefit.key, openedFrom);
            return (
              <View
                key={benefit.key}
                testID={paywallBenefitTestId(benefit.key)}
                className="min-h-[50px] flex-row items-center gap-3 px-3.5 py-1.5"
                style={{ backgroundColor: hot ? c.accentSoft : 'transparent' }}>
                <View
                  className="h-7 w-7 items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: hot ? c.accent : c.neutralButton }}>
                  <CheckIcon color={hot ? c.onAccent : c.accent} size={16} />
                </View>
                <View className="min-w-0 flex-1 gap-px">
                  <Text className="font-sans-bold text-body-sm text-ink">{benefit.title}</Text>
                  <Text className="font-sans text-label text-ink-muted">{benefit.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-center font-sans text-label text-ink-muted">
          無料版のまま使える機能：カウント・自動保存・項目数無制限
        </Text>

        {!available ? (
          <Text testID="paywall-unavailable" className="text-center font-sans text-label text-danger">
            {DEV_BUILD_ONLY_MESSAGE}
          </Text>
        ) : null}
        {available && offeringsError ? (
          <Text
            testID={offeringsEmpty ? 'paywall-empty' : 'paywall-error'}
            className="text-center font-sans text-label text-danger">
            {offeringsError}
          </Text>
        ) : null}
      </ScrollView>

      <View className="gap-2.5 px-5" style={{ paddingBottom: paywallFooterBottom(insets.bottom) }}>
        {isPro ? (
          <View testID="paywall-purchased" className="items-center gap-2.5">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-accent-soft">
              <CheckIcon color={c.accentInk} size={26} />
            </View>
            <Text className="font-sans-bold text-title text-ink">Proになりました</Text>
            <Text className="font-sans text-body-sm text-ink-muted">広告が消え、すべての機能が使えます</Text>
            <Pressable
              testID="paywall-start"
              accessibilityRole="button"
              accessibilityLabel="はじめる"
              onPress={() => closePaywall(openedFrom, true)}
              className="h-14 w-full items-center justify-center rounded-card bg-ink active:opacity-80">
              <Text className="font-sans-bold text-title text-background">はじめる</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-2.5">
            {priceString ? (
              <View className="flex-row items-baseline justify-center gap-2">
                <Text className="font-sans-medium text-body-sm text-ink-muted">買い切り</Text>
                <Text testID="paywall-price" className="font-mono-semibold text-total-sm text-ink">
                  {priceString}
                </Text>
              </View>
            ) : (
              <Text
                testID="paywall-price-fallback"
                className="text-center font-sans text-label text-ink-muted">
                {PRICE_UNAVAILABLE_MESSAGE}
              </Text>
            )}
            <Text className="text-center font-sans text-label text-ink-muted">
              サブスクではありません。追加の支払いはありません。
            </Text>
            <Pressable
              testID="paywall-buy"
              accessibilityRole="button"
              accessibilityLabel={buyLabel}
              accessibilityState={{ disabled: buyDisabled }}
              disabled={buyDisabled}
              onPress={handleBuy}
              className={`h-14 items-center justify-center rounded-card bg-accent ${
                buyDisabled ? 'opacity-50' : 'active:opacity-80'
              }`}>
              <Text className="font-sans-bold text-title text-on-accent">{buyLabel}</Text>
            </Pressable>
          </View>
        )}

        <View className="flex-row justify-center gap-4">
          <Pressable
            testID="paywall-terms"
            accessibilityRole="link"
            accessibilityLabel="利用規約"
            onPress={() => {
              void openSupportLink('terms').then((result) => {
                if (result.ok || result.reason === 'busy') return;
                Alert.alert('準備中', result.message ?? 'この機能は準備中です。');
              });
            }}
            className="h-11 items-center justify-center">
            <Text className="font-sans text-label text-accent">利用規約</Text>
          </Pressable>
          <Pressable
            testID="paywall-privacy"
            accessibilityRole="link"
            accessibilityLabel="プライバシーポリシー"
            onPress={() => {
              void openSupportLink('privacy').then((result) => {
                if (result.ok || result.reason === 'busy') return;
                Alert.alert('準備中', result.message ?? 'この機能は準備中です。');
              });
            }}
            className="h-11 items-center justify-center">
            <Text className="font-sans text-label text-accent">プライバシーポリシー</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
