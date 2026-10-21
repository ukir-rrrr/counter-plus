import { itemColorOrder, type ItemColor } from '@/constants/theme';

/**
 * カテゴリ内の現在の品目数に応じて、次に付ける既定色を返す。
 * 先頭は青。6色で循環する。削除で件数が減ると、同じ色が再利用される。
 */
export function nextDefaultItemColor(existingCountInCategory: number): ItemColor {
  const n = itemColorOrder.length;
  const count = Number.isFinite(existingCountInCategory)
    ? Math.max(0, Math.trunc(existingCountInCategory))
    : 0;
  return itemColorOrder[count % n];
}
