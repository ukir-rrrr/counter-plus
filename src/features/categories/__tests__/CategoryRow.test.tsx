import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { CategoryRow, openCategoryEdit, type CategoryRowProps } from '../components/CategoryRow';
import { categoryDragHandleTestId, categoryRowTestId } from '../components/categoryRowTestIds';
import type { CategoryWithStats } from '../store';

jest.mock('react-native-reanimated', () => ({
  runOnJS: (fn: unknown) => fn,
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  GestureDetector: ({ children }: { children: unknown }) => children,
  Gesture: {
    LongPress: () => ({
      minDuration() {
        return this;
      },
      onStart() {
        return this;
      },
    }),
  },
}));

const item: CategoryWithStats = {
  id: 'cat-1',
  name: 'カテゴリ 1',
  sortOrder: 0,
  createdAt: 1,
  updatedAt: 1,
  itemCount: 3,
  total: 12,
};

async function renderRow(overrides: Partial<CategoryRowProps> = {}) {
  const props = {
    item,
    index: 0,
    isSelected: false,
    isEditing: false,
    isActive: false,
    onDrag: jest.fn(),
    onSelect: jest.fn(),
    onRename: jest.fn(),
    onDelete: jest.fn(),
    ...overrides,
  };
  const result = await render(<CategoryRow {...props} />);
  return { ...result, props };
}

describe('categoryRowTestIds', () => {
  it('実行ごとの UUID ではなく、リスト位置の安定した ID を返す', () => {
    expect(categoryRowTestId(0)).toBe('category-row-0');
    expect(categoryDragHandleTestId(1)).toBe('category-drag-handle-1');
  });
});

describe('CategoryRow', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('通常：行とハンドルの testID がある', async () => {
    const { getByTestId } = await renderRow({ index: 2 });
    expect(getByTestId('category-row-2')).toBeTruthy();
    expect(getByTestId('category-drag-handle-2')).toBeTruthy();
  });

  it('ハンドルの pressIn は並べ替えを始め、編集は開かない', async () => {
    const { getByTestId, props } = await renderRow();

    await act(async () => {
      fireEvent(getByTestId('category-drag-handle-0'), 'pressIn');
    });

    expect(props.onDrag).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(props.onRename).not.toHaveBeenCalled();
  });

  it('ハンドルを長押ししても編集は開かない', async () => {
    const { getByTestId, props } = await renderRow();

    await act(async () => {
      fireEvent(getByTestId('category-drag-handle-0'), 'longPress');
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(props.onRename).not.toHaveBeenCalled();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('名前エリアの長押しは編集を開き、drag しない', async () => {
    const { getByLabelText, props } = await renderRow();

    await act(async () => {
      fireEvent(getByLabelText(/カテゴリ 1/), 'longPress');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'カテゴリ 1',
      undefined,
      expect.arrayContaining([
        expect.objectContaining({ text: '名前を変更' }),
        expect.objectContaining({ text: '削除' }),
      ])
    );
    expect(props.onDrag).not.toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('openCategoryEdit は変更と削除の選択肢を出す', () => {
    openCategoryEdit(item, jest.fn(), jest.fn());
    expect(Alert.alert).toHaveBeenCalledWith('カテゴリ 1', undefined, expect.any(Array));
  });

  it('通常タップはカテゴリを選択する', async () => {
    const { getByLabelText, props } = await renderRow();

    await act(async () => {
      fireEvent.press(getByLabelText(/カテゴリ 1/));
    });

    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onDrag).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('連打：名前エリアのタップは毎回選択する', async () => {
    const { getByLabelText, props } = await renderRow();
    const body = getByLabelText(/カテゴリ 1/);

    await act(async () => {
      fireEvent.press(body);
      fireEvent.press(body);
      fireEvent.press(body);
    });

    expect(props.onSelect).toHaveBeenCalledTimes(3);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('連打：ハンドルの pressIn は毎回 drag し、編集は開かない', async () => {
    const { getByTestId, props } = await renderRow();
    const handle = getByTestId('category-drag-handle-0');

    await act(async () => {
      fireEvent(handle, 'pressIn');
      fireEvent(handle, 'pressIn');
      fireEvent(handle, 'pressIn');
    });

    expect(props.onDrag).toHaveBeenCalledTimes(3);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('空：編集モードのタップでは選択しない', async () => {
    const { getByLabelText, props } = await renderRow({ isEditing: true });

    await act(async () => {
      fireEvent.press(getByLabelText(/カテゴリ 1/));
    });

    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
