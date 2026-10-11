/** 編集シートを閉じる処理を1回だけ通す。2回目以降は false */
export function claimLeave(leaving: { current: boolean }): boolean {
  if (leaving.current) return false;
  leaving.current = true;
  return true;
}
