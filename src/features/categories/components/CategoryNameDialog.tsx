import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/constants/use-theme-colors';

export function CategoryNameDialog({
  visible,
  title,
  initialName,
  placeholder,
  submitLabel,
  allowEmpty,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initialName: string;
  placeholder?: string;
  submitLabel: string;
  /** 空でも確定できる（追加時。親でデフォルト名に落とす） */
  allowEmpty?: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <CategoryNameDialogInner
      title={title}
      initialName={initialName}
      placeholder={placeholder}
      submitLabel={submitLabel}
      allowEmpty={allowEmpty}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

function CategoryNameDialogInner({
  title,
  initialName,
  placeholder,
  submitLabel,
  allowEmpty,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialName: string;
  placeholder?: string;
  submitLabel: string;
  allowEmpty?: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const c = useThemeColors();
  const [name, setName] = useState(initialName);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed && !allowEmpty) return;
    onSubmit(trimmed);
  };

  return (
    <View testID="category-name-dialog" className="absolute inset-0 items-center justify-center bg-black/50">
      <View accessible={false} className="mx-8 w-full max-w-sm rounded-card bg-surface p-5">
        <Text accessibilityRole="header" className="mb-4 text-center font-sans-bold text-title text-ink">
          {title}
        </Text>
        <TextInput
          ref={inputRef}
          testID="category-name-input"
          accessibilityLabel="カテゴリ名"
          value={name}
          onChangeText={setName}
          placeholder={placeholder}
          placeholderTextColor={c.inkSubtle}
          className="mb-4 h-11 rounded-control border border-border bg-background px-3 font-sans text-body text-ink"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <View className="flex-row gap-3">
          <Pressable
            testID="category-name-cancel"
            accessibilityRole="button"
            accessibilityLabel="キャンセル"
            onPress={onCancel}
            className="h-11 flex-1 items-center justify-center rounded-control bg-neutral-button active:opacity-70">
            <Text className="font-sans-medium text-body text-ink">キャンセル</Text>
          </Pressable>
          <Pressable
            testID="category-name-submit"
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            onPress={submit}
            className="h-11 flex-1 items-center justify-center rounded-control bg-accent active:opacity-70">
            <Text className="font-sans-medium text-body text-on-accent">{submitLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
