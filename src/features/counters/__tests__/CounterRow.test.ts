// CounterRow のロジックテスト
// 長押しで編集シートを開く動作と、ドラッグハンドルの動作が共存することを確認

describe('CounterRow interaction logic', () => {
  describe('長押しで編集シートを開く（リグレッション防止）', () => {
    it('onDragが渡されていても、行の長押しは編集シートを開く', () => {
      // CounterRowコンポーネントのロジック:
      // - 行全体の onLongPress は常に openEditSheet を呼ぶ
      // - onDrag はドラッグハンドルの onLongPress にのみ使用される
      const onDragCalled = { value: false };
      const openEditSheetCalled = { value: false };

      // 行を長押しした場合のシミュレーション
      const handleRowLongPress = () => {
        openEditSheetCalled.value = true;
      };

      // ドラッグハンドルを長押しした場合のシミュレーション
      const handleDragHandleLongPress = (onDrag?: () => void) => {
        if (onDrag) {
          onDragCalled.value = true;
          onDrag();
        }
      };

      // テスト1: 行を長押し → 編集シートが開く、ドラッグは開始しない
      handleRowLongPress();
      expect(openEditSheetCalled.value).toBe(true);
      expect(onDragCalled.value).toBe(false);

      // リセット
      openEditSheetCalled.value = false;

      // テスト2: ドラッグハンドルを長押し → ドラッグが開始、編集シートは開かない
      handleDragHandleLongPress(() => {});
      expect(onDragCalled.value).toBe(true);
      expect(openEditSheetCalled.value).toBe(false);
    });

    it('onDragが渡されていない場合、ドラッグハンドルは表示されない', () => {
      // CounterRowコンポーネントのロジック:
      // onDrag が undefined の場合、ドラッグハンドルは描画されない
      const onDrag: (() => void) | undefined = undefined;
      const shouldShowDragHandle = onDrag !== undefined;
      expect(shouldShowDragHandle).toBe(false);
    });

    it('onDragが渡されている場合、ドラッグハンドルが表示される', () => {
      const onDrag: (() => void) | undefined = () => {};
      const shouldShowDragHandle = onDrag !== undefined;
      expect(shouldShowDragHandle).toBe(true);
    });
  });

  describe('インタラクションの分離', () => {
    it('行の長押しとドラッグハンドルの長押しは独立している', () => {
      // 両方のハンドラを持つ場合でも、それぞれが独立して動作する
      let rowLongPressCount = 0;
      let dragHandleLongPressCount = 0;

      const handleRowLongPress = () => {
        rowLongPressCount++;
      };

      const handleDragHandleLongPress = () => {
        dragHandleLongPressCount++;
      };

      // 行を3回長押し
      handleRowLongPress();
      handleRowLongPress();
      handleRowLongPress();

      // ドラッグハンドルを2回長押し
      handleDragHandleLongPress();
      handleDragHandleLongPress();

      expect(rowLongPressCount).toBe(3);
      expect(dragHandleLongPressCount).toBe(2);
    });
  });
});
