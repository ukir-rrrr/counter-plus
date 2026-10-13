/** UI テスト用。UUID ではなくリスト位置で行とハンドルを指定する */
export function categoryRowTestId(index: number): string {
  return `category-row-${index}`;
}

export function categoryDragHandleTestId(index: number): string {
  return `category-drag-handle-${index}`;
}
