import { defaultCategoryName, resolveCategoryName } from '../name';

describe('defaultCategoryName', () => {
  it('既存件数+1 の「カテゴリ N」を返す', () => {
    expect(defaultCategoryName(0)).toBe('カテゴリ 1');
    expect(defaultCategoryName(1)).toBe('カテゴリ 2');
    expect(defaultCategoryName(3)).toBe('カテゴリ 4');
  });
});

describe('resolveCategoryName', () => {
  const fallback = 'カテゴリ 2';

  it('入力した名前をトリムして使う', () => {
    expect(resolveCategoryName('棚 A', fallback)).toBe('棚 A');
    expect(resolveCategoryName('  棚 A  ', fallback)).toBe('棚 A');
  });

  it('空・空白・undefined はデフォルト名に落とす', () => {
    expect(resolveCategoryName('', fallback)).toBe(fallback);
    expect(resolveCategoryName('   ', fallback)).toBe(fallback);
    expect(resolveCategoryName(undefined, fallback)).toBe(fallback);
  });

  it('デフォルト名と同じ文字を入力してもそのまま使う', () => {
    expect(resolveCategoryName(fallback, fallback)).toBe(fallback);
  });
});
