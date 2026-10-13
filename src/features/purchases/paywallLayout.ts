/** 日本語24pxでもグリフが切れない行の高さ。RNの Text は lineHeight でクリップする */
export const PAYWALL_TITLE_STYLE = {
  fontSize: 24,
  lineHeight: 36,
  paddingTop: 4,
} as const;

/** モーダルで insets.top が 0 でもヘッダーがノッチ／ステータスバーに食い込まない */
export const PAYWALL_MIN_TOP_INSET = 16;

/** iPhone SE（ノッチなし）と Dynamic Island 機の実機でよく見る値 */
export const PAYWALL_SE_TOP_INSET = 20;
export const PAYWALL_LARGE_TOP_INSET = 59;

/** 開発用歯車が左下に重なるときの退避余白 */
export const PAYWALL_FAB_CLEARANCE = 56;

export function paywallTopInset(safeTop: number): number {
  return Number.isFinite(safeTop) && safeTop > 0
    ? Math.max(safeTop, PAYWALL_MIN_TOP_INSET)
    : PAYWALL_MIN_TOP_INSET;
}

/** ホームインジケータ＋（開発中のみ）歯車FABの下余白 */
export function paywallFooterBottom(safeBottom: number, isDev: boolean = __DEV__): number {
  const base = Number.isFinite(safeBottom) && safeBottom > 0 ? Math.max(safeBottom, 16) : 16;
  return isDev ? base + PAYWALL_FAB_CLEARANCE : base;
}
