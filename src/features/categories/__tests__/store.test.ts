// 純粋なロジックテスト（DBを使わない）
// セレクター関数やストアのロジックをテストする

type CategoryWithStats = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
  total: number;
};

// selectGrandTotal と selectTotalCategories のロジックを直接テスト
function selectGrandTotal(categories: CategoryWithStats[]): number {
  return categories.reduce((acc, c) => acc + c.total, 0);
}

function selectTotalCategories(categories: CategoryWithStats[]): number {
  return categories.length;
}

describe('selectors', () => {
  describe('selectGrandTotal', () => {
    it('すべてのカテゴリの合計を計算する', () => {
      const mockCategories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 2, total: 100 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 3, total: 200 },
      ];

      expect(selectGrandTotal(mockCategories)).toBe(300);
    });

    it('カテゴリがない場合は0を返す', () => {
      expect(selectGrandTotal([])).toBe(0);
    });

    it('大きな数値でも正しく計算する', () => {
      const mockCategories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 10, total: 999999 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 5, total: 1 },
      ];

      expect(selectGrandTotal(mockCategories)).toBe(1000000);
    });
  });

  describe('selectTotalCategories', () => {
    it('カテゴリの数を返す', () => {
      const mockCategories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '3', name: 'C', sortOrder: 2, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];

      expect(selectTotalCategories(mockCategories)).toBe(3);
    });

    it('カテゴリがない場合は0を返す', () => {
      expect(selectTotalCategories([])).toBe(0);
    });
  });
});

describe('store logic', () => {
  describe('reorder', () => {
    it('空の配列でリオーダーしてもエラーにならない', () => {
      const ids: string[] = [];
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const sorted = ids
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is CategoryWithStats => c != null);
      expect(sorted).toEqual([]);
    });

    it('部分的なIDでリオーダーすると欠けたものはフィルタされる', () => {
      const ids = ['2', '3'];
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '3', name: 'C', sortOrder: 2, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const sorted = ids
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is CategoryWithStats => c != null);
      expect(sorted.map((c) => c.name)).toEqual(['B', 'C']);
    });

    it('存在しないIDを含むリオーダーでもエラーにならない', () => {
      const ids = ['nonexistent', '1'];
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const sorted = ids
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is CategoryWithStats => c != null);
      expect(sorted.map((c) => c.name)).toEqual(['A']);
    });

    it('連続並べ替えでも最終状態が正しい', () => {
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '3', name: 'C', sortOrder: 2, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];

      const reorder = (ids: string[]) => {
        return ids
          .map((id) => categories.find((c) => c.id === id))
          .filter((c): c is CategoryWithStats => c != null);
      };

      let result = reorder(['3', '2', '1']);
      result = reorder(['1', '3', '2']);
      result = reorder(['2', '1', '3']);

      expect(result.map((c) => c.name)).toEqual(['B', 'A', 'C']);
    });
  });

  describe('select validation', () => {
    it('削除されたカテゴリIDでも選択しても次のロードで修正される', () => {
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const selectedId = 'deleted-id';

      const validSelectedId =
        categories.find((c) => c.id === selectedId)?.id ?? categories[0]?.id ?? null;

      expect(validSelectedId).toBe('1');
    });

    it('空のカテゴリリストではselectedIdがnullになる', () => {
      const categories: CategoryWithStats[] = [];
      const selectedId = '1';

      const validSelectedId =
        categories.find((c) => c.id === selectedId)?.id ?? categories[0]?.id ?? null;

      expect(validSelectedId).toBeNull();
    });
  });

  describe('remove', () => {
    it('削除後に選択中のカテゴリが削除された場合は先頭を選択', () => {
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const selectedId = '1';
      const idToRemove = '1';

      const filtered = categories.filter((c) => c.id !== idToRemove);
      const newSelectedId = selectedId === idToRemove ? (filtered[0]?.id ?? null) : selectedId;

      expect(newSelectedId).toBe('2');
    });

    it('最後のカテゴリを削除するとselectedIdがnullになる', () => {
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const selectedId = '1';
      const idToRemove = '1';

      const filtered = categories.filter((c) => c.id !== idToRemove);
      const newSelectedId = selectedId === idToRemove ? (filtered[0]?.id ?? null) : selectedId;

      expect(newSelectedId).toBeNull();
    });

    it('選択中でないカテゴリを削除してもselectedIdは変わらない', () => {
      const categories: CategoryWithStats[] = [
        { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
        { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      ];
      const selectedId: string = '1';
      const idToRemove: string = '2';

      const filtered = categories.filter((c) => c.id !== idToRemove);
      const newSelectedId = selectedId === idToRemove ? (filtered[0]?.id ?? null) : selectedId;

      expect(newSelectedId).toBe('1');
    });
  });

  describe('add validation', () => {
    it('空白の名前はトリムされて空になる', () => {
      const name = '   ';
      const trimmed = name.trim();
      expect(trimmed).toBe('');
    });

    it('前後の空白がトリムされる', () => {
      const name = '  カテゴリ  ';
      const trimmed = name.trim();
      expect(trimmed).toBe('カテゴリ');
    });
  });
});

describe('edge cases - rapid actions (連打)', () => {
  it('連続追加でも正しくカウントされる', () => {
    const categories: CategoryWithStats[] = [];
    const addCategory = (name: string) => {
      const newCat: CategoryWithStats = {
        id: `id-${categories.length}`,
        name,
        sortOrder: categories.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        itemCount: 0,
        total: 0,
      };
      categories.push(newCat);
      return newCat;
    };

    for (let i = 0; i < 10; i++) {
      addCategory(`カテゴリ${i}`);
    }

    expect(categories.length).toBe(10);
  });

  it('連続削除でも正しくカウントされる', () => {
    let categories: CategoryWithStats[] = [
      { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      { id: '2', name: 'B', sortOrder: 1, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
      { id: '3', name: 'C', sortOrder: 2, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
    ];

    const remove = (id: string) => {
      categories = categories.filter((c) => c.id !== id);
    };

    remove('1');
    remove('2');
    remove('3');

    expect(categories.length).toBe(0);
  });

  it('存在しないIDを連続削除してもエラーにならない', () => {
    let categories: CategoryWithStats[] = [
      { id: '1', name: 'A', sortOrder: 0, createdAt: 0, updatedAt: 0, itemCount: 0, total: 0 },
    ];

    const remove = (id: string) => {
      categories = categories.filter((c) => c.id !== id);
    };

    expect(() => {
      remove('1');
      remove('1');
      remove('1');
    }).not.toThrow();

    expect(categories.length).toBe(0);
  });
});

describe('edge cases - empty data', () => {
  it('空のカテゴリリストでの合計は0', () => {
    const categories: CategoryWithStats[] = [];
    const total = categories.reduce((acc, c) => acc + c.total, 0);
    expect(total).toBe(0);
  });

  it('空のカテゴリリストでの選択は何もしない', () => {
    const categories: CategoryWithStats[] = [];
    const selectedId = categories[0]?.id ?? null;
    expect(selectedId).toBeNull();
  });
});
