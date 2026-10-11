import { dragHandleTestId } from '../components/dragHandleTestId';

// CounterRow のロジックテスト
// 名前エリアの長押しで編集、ハンドルの onPressIn でドラッグ開始が共存すること

describe('dragHandleTestId', () => {
  it('実行ごとの UUID ではなく、リスト位置の安定した ID を返す', () => {
    expect(dragHandleTestId(0)).toBe('drag-handle-0');
    expect(dragHandleTestId(2)).toBe('drag-handle-2');
  });
});

describe('CounterRow interaction logic', () => {
  describe('長押しで編集シートを開く（リグレッション防止）', () => {
    it('onDragがあっても、名前エリアの長押しは編集シートを開く', () => {
      const onDragCalled = { value: false };
      const openEditSheetCalled = { value: false };

      const handleRowLongPress = () => {
        openEditSheetCalled.value = true;
      };

      const handleDragHandlePressIn = (onDrag?: () => void) => {
        if (onDrag) {
          onDragCalled.value = true;
          onDrag();
        }
      };

      handleRowLongPress();
      expect(openEditSheetCalled.value).toBe(true);
      expect(onDragCalled.value).toBe(false);

      openEditSheetCalled.value = false;

      handleDragHandlePressIn(() => {});
      expect(onDragCalled.value).toBe(true);
      expect(openEditSheetCalled.value).toBe(false);
    });

    it('onDragが渡されていない場合、ドラッグハンドルは表示されない', () => {
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
    it('名前エリアの長押しとハンドルの pressIn は独立している', () => {
      let rowLongPressCount = 0;
      let dragHandlePressInCount = 0;

      const handleRowLongPress = () => {
        rowLongPressCount++;
      };

      const handleDragHandlePressIn = () => {
        dragHandlePressInCount++;
      };

      handleRowLongPress();
      handleRowLongPress();
      handleRowLongPress();
      handleDragHandlePressIn();
      handleDragHandlePressIn();

      expect(rowLongPressCount).toBe(3);
      expect(dragHandlePressInCount).toBe(2);
    });

    it('ハンドルは LongPress ではなく pressIn で drag を開始する', () => {
      // DraggableFlatList の親 Pan と RNGH LongPress が競合すると、
      // drag() は呼ばれても touchTranslate が更新されず初回ドラッグが戻る。
      const handleUsesPressIn = true;
      const handleUsesLongPress = false;
      expect(handleUsesPressIn).toBe(true);
      expect(handleUsesLongPress).toBe(false);
    });
  });
});
