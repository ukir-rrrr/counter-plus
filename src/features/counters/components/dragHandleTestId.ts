/** UI テスト用。UUID ではなくリスト位置でハンドルを指定する */
export function dragHandleTestId(index: number): string {
  return `drag-handle-${index}`;
}
