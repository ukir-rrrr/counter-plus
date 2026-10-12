import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon, ShareUpIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { useCategoriesStore } from '@/features/categories/store';
import { waitForCounterWrites } from '@/features/counters/store';
import {
  buildCsv,
  buildCsvFileName,
  CSV_UPDATED_AT_HEADER,
  previewLines,
  type CsvColumnOptions,
  type CsvExportRow,
} from '@/features/export/csv';
import { listExportRows } from '@/features/export/repository';
import { shareCsvFile } from '@/features/export/share';

type Scope = 'current' | 'all';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  const categories = useCategoriesStore((s) => s.categories);
  const selectedId = useCategoriesStore((s) => s.selectedId);
  const categoriesLoad = useCategoriesStore((s) => s.load);

  const selectedCategory = categories.find((cat) => cat.id === selectedId);
  const categoryName = selectedCategory?.name ?? '';

  const [scope, setScope] = useState<Scope>('current');
  const [includeCategory, setIncludeCategory] = useState(true);
  const [includeMemo, setIncludeMemo] = useState(true);
  const [includeUpdatedAt, setIncludeUpdatedAt] = useState(false);
  const [rows, setRows] = useState<CsvExportRow[]>([]);
  const [fileNow, setFileNow] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const options: CsvColumnOptions = useMemo(
    () => ({ includeCategory, includeMemo, includeUpdatedAt }),
    [includeCategory, includeMemo, includeUpdatedAt],
  );

  const loadRows = useCallback(async () => {
    try {
      await waitForCounterWrites();
      const next = await listExportRows(scope === 'all' ? undefined : selectedId);
      setRows(next);
      setFileNow(Date.now());
      setLoadError(null);
    } catch (e: unknown) {
      setRows([]);
      setLoadError(e instanceof Error ? e.message : '項目を読み込めませんでした');
    }
  }, [scope, selectedId]);

  useFocusEffect(
    useCallback(() => {
      categoriesLoad();
      loadRows();
    }, [categoriesLoad, loadRows]),
  );

  const csv = useMemo(() => buildCsv(rows, options), [rows, options]);
  const fileName = useMemo(
    () => buildCsvFileName(scope === 'all' ? 'all' : categoryName || 'export', fileNow),
    [scope, categoryName, fileNow],
  );
  const lines = useMemo(() => previewLines(csv), [csv]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareCsvFile(fileName, csv);
      if (result.ok) return;
      if (result.reason === 'busy') return;
      if (result.reason === 'unavailable') {
        Alert.alert('共有できません', 'この端末では共有シートを使えません。');
        return;
      }
      Alert.alert('書き出せませんでした', result.message ?? 'もう一度試してください。');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-2.5 pb-1.5">
        <Pressable
          testID="export-close"
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
          <CloseIcon color={c.ink} />
        </Pressable>
        <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
          CSVで書き出す
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-screen pt-1 pb-4">
        <View className="gap-2">
          <Text className="font-sans-medium text-label text-ink-muted">書き出す範囲</Text>
          <View className="flex-row gap-1 rounded-control bg-ad-bg p-1">
            <ScopeButton
              testID="export-scope-current"
              label={categoryName ? `このカテゴリ（${categoryName}）` : 'このカテゴリ'}
              selected={scope === 'current'}
              onPress={() => setScope('current')}
            />
            <ScopeButton
              testID="export-scope-all"
              label="すべてのカテゴリ"
              selected={scope === 'all'}
              onPress={() => setScope('all')}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="font-sans-medium text-label text-ink-muted">
            含める列（項目名と数は必ず含みます）
          </Text>
          <View className="overflow-hidden rounded-card border border-border bg-surface">
            <ColumnToggle
              testID="export-column-category"
              label="カテゴリ名"
              checked={includeCategory}
              onToggle={() => setIncludeCategory((v) => !v)}
            />
            <ColumnToggle
              testID="export-column-memo"
              label="メモ"
              checked={includeMemo}
              onToggle={() => setIncludeMemo((v) => !v)}
            />
            <ColumnToggle
              testID="export-column-updated-at"
              label={CSV_UPDATED_AT_HEADER}
              checked={includeUpdatedAt}
              onToggle={() => setIncludeUpdatedAt((v) => !v)}
              last
            />
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="font-sans-medium text-label text-ink-muted">プレビュー</Text>
            <Text
              testID="export-filename"
              accessibilityLabel={`ファイル名 ${fileName}`}
              className="font-mono-medium text-label text-ink-muted">
              {fileName}
            </Text>
          </View>
          <View
            testID="export-preview"
            accessible={false}
            className="rounded-card bg-ink px-3.5 py-3">
            {loadError ? (
              <Text className="font-mono-medium text-hint text-danger">{loadError}</Text>
            ) : (
              lines.map((line, i) => (
                <Text
                  key={`${i}-${line}`}
                  numberOfLines={1}
                  className={`font-mono-medium text-hint ${
                    i === 0 ? 'text-accent-ink' : 'text-background'
                  }`}>
                  {line}
                </Text>
              ))
            )}
          </View>
          <Text className="font-sans text-hint text-ink-subtle">
            Excelで開いても文字化けしない形式（UTF-8 BOM付き）で保存します
          </Text>
        </View>
      </ScrollView>

      <View className="gap-2 px-screen" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Pressable
          testID="export-share"
          accessibilityRole="button"
          accessibilityLabel="共有シートで送る"
          accessibilityState={{ disabled: sharing }}
          disabled={sharing}
          onPress={handleShare}
          className="h-14 flex-row items-center justify-center gap-2 rounded-card bg-accent active:opacity-80">
          <ShareUpIcon color={c.onAccent} />
          <Text className="font-sans-bold text-body text-on-accent">
            {sharing ? '準備しています…' : '共有シートで送る'}
          </Text>
        </Pressable>
        <Text className="text-center font-sans text-hint text-ink-subtle">
          メール・AirDrop・「ファイル」への保存などを選べます
        </Text>
      </View>
    </View>
  );
}

function ScopeButton({
  testID,
  label,
  selected,
  onPress,
}: {
  testID: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-11 min-w-0 flex-1 items-center justify-center rounded-control ${
        selected ? 'bg-surface' : 'bg-transparent'
      }`}>
      <Text
        numberOfLines={1}
        className={`px-1 text-center text-body-sm text-ink ${selected ? 'font-sans-bold' : 'font-sans-medium'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ColumnToggle({
  testID,
  label,
  checked,
  onToggle,
  last,
}: {
  testID: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onToggle}
      className={`h-12 flex-row items-center justify-between px-3.5 ${last ? '' : 'border-b border-divider'}`}>
      <Text className="font-sans text-body text-ink">{label}</Text>
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          checked ? 'border-accent bg-accent' : 'border-border bg-surface'
        }`}>
        {checked ? <CheckIcon color={c.onAccent} size={12} /> : null}
      </View>
    </Pressable>
  );
}
