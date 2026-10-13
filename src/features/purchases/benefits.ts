import type { PaywallOpenedFrom } from '@/lib/purchases';

export const PAYWALL_BENEFITS = [
  { key: 'csv', title: 'CSVで書き出し', desc: '数えた結果をそのままExcelへ。転記はもう不要' },
  { key: 'history', title: '履歴', desc: 'いつ・何を・いくつ数えたかを時刻つきで確認' },
  { key: 'category', title: 'カテゴリ無制限', desc: '棚・場所・売り場ごとに分けて数える' },
  { key: 'sort', title: '自動並べ替え', desc: '名前順・数の多い順・少ない順' },
  { key: 'ads', title: '広告を非表示', desc: '作業中に広告が出なくなる' },
] as const;

export type PaywallBenefitKey = (typeof PAYWALL_BENEFITS)[number]['key'];

/** openedFrom と一致する特典だけを強調する。設定からの案内では強調しない */
export function isBenefitHighlighted(key: string, openedFrom: PaywallOpenedFrom): boolean {
  return key === openedFrom;
}

export function paywallBenefitTestId(key: string): string {
  return `paywall-benefit-${key}`;
}
