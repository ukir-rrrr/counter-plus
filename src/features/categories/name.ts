/** 追加ダイアログのデフォルト名（プレースホルダ兼、空入力時のフォールバック） */
export function defaultCategoryName(existingCount: number): string {
  return `カテゴリ ${existingCount + 1}`;
}

/** 入力が空／空白だけならフォールバック。前後の空白は除く */
export function resolveCategoryName(input: string | undefined, fallback: string): string {
  const trimmed = input?.trim() ?? '';
  return trimmed === '' ? fallback : trimmed;
}
