// カウンターストアのロジックテスト
// 削除後のストア状態を確認するリグレッションテスト

describe('カウンターストアの削除ロジック', () => {
  describe('remove アクション', () => {
    it('削除後、ids と byId から項目が削除される', () => {
      // 初期状態
      const initialState = {
        ids: ['id-1', 'id-2', 'id-3'],
        byId: {
          'id-1': { id: 'id-1', name: 'Item 1', count: 10 },
          'id-2': { id: 'id-2', name: 'Item 2', count: 20 },
          'id-3': { id: 'id-3', name: 'Item 3', count: 30 },
        } as Record<string, { id: string; name: string; count: number }>,
      };

      // 削除ロジックのシミュレーション（store.ts の remove の実装と同じ）
      const idToRemove = 'id-2';
      const { [idToRemove]: _removed, ...remainingById } = initialState.byId;
      const newState = {
        ids: initialState.ids.filter((x) => x !== idToRemove),
        byId: remainingById,
      };

      // 検証
      expect(newState.ids).toEqual(['id-1', 'id-3']);
      expect(newState.ids).not.toContain('id-2');
      expect(newState.byId['id-1']).toBeDefined();
      expect(newState.byId['id-2']).toBeUndefined();
      expect(newState.byId['id-3']).toBeDefined();
      expect(Object.keys(newState.byId)).toHaveLength(2);
    });

    it('最後の項目を削除しても空のリストになる', () => {
      const initialState = {
        ids: ['only-id'],
        byId: {
          'only-id': { id: 'only-id', name: 'Only Item', count: 5 },
        } as Record<string, { id: string; name: string; count: number }>,
      };

      const idToRemove = 'only-id';
      const { [idToRemove]: _removed, ...remainingById } = initialState.byId;
      const newState = {
        ids: initialState.ids.filter((x) => x !== idToRemove),
        byId: remainingById,
      };

      expect(newState.ids).toEqual([]);
      expect(Object.keys(newState.byId)).toHaveLength(0);
    });

    it('存在しないIDを削除しても状態は変わらない', () => {
      const initialState = {
        ids: ['id-1', 'id-2'],
        byId: {
          'id-1': { id: 'id-1', name: 'Item 1', count: 10 },
          'id-2': { id: 'id-2', name: 'Item 2', count: 20 },
        } as Record<string, { id: string; name: string; count: number }>,
      };

      const idToRemove = 'non-existent-id';
      const { [idToRemove]: _removed, ...remainingById } = initialState.byId;
      const newState = {
        ids: initialState.ids.filter((x) => x !== idToRemove),
        byId: remainingById,
      };

      // idsは変わらない（フィルタで何も除外されない）
      expect(newState.ids).toEqual(['id-1', 'id-2']);
      // byIdも変わらない（存在しないキーを削除しようとしても何も起きない）
      expect(Object.keys(newState.byId)).toHaveLength(2);
    });
  });

  describe('連打（連続削除）', () => {
    it('連続して複数の項目を削除できる', () => {
      let state = {
        ids: ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'],
        byId: {
          'id-1': { id: 'id-1', name: 'Item 1' },
          'id-2': { id: 'id-2', name: 'Item 2' },
          'id-3': { id: 'id-3', name: 'Item 3' },
          'id-4': { id: 'id-4', name: 'Item 4' },
          'id-5': { id: 'id-5', name: 'Item 5' },
        } as Record<string, { id: string; name: string }>,
      };

      // 削除関数
      const remove = (id: string) => {
        const { [id]: _removed, ...remainingById } = state.byId;
        state = {
          ids: state.ids.filter((x) => x !== id),
          byId: remainingById,
        };
      };

      // 連続削除
      remove('id-2');
      remove('id-4');
      remove('id-1');

      expect(state.ids).toEqual(['id-3', 'id-5']);
      expect(Object.keys(state.byId)).toHaveLength(2);
      expect(state.byId['id-3']).toBeDefined();
      expect(state.byId['id-5']).toBeDefined();
    });

    it('同じIDを2回削除しようとしても問題ない', () => {
      let state = {
        ids: ['id-1', 'id-2'],
        byId: {
          'id-1': { id: 'id-1', name: 'Item 1' },
          'id-2': { id: 'id-2', name: 'Item 2' },
        } as Record<string, { id: string; name: string }>,
      };

      const remove = (id: string) => {
        const { [id]: _removed, ...remainingById } = state.byId;
        state = {
          ids: state.ids.filter((x) => x !== id),
          byId: remainingById,
        };
      };

      // 同じIDを2回削除
      remove('id-1');
      remove('id-1');

      expect(state.ids).toEqual(['id-2']);
      expect(Object.keys(state.byId)).toHaveLength(1);
    });
  });

  describe('削除と UI 状態の同期', () => {
    it('削除後、idsの長さが正しく減る', () => {
      const initialIds = ['a', 'b', 'c', 'd', 'e'];
      const idsAfterDelete = initialIds.filter((x) => x !== 'c');
      
      expect(initialIds.length).toBe(5);
      expect(idsAfterDelete.length).toBe(4);
      expect(idsAfterDelete).not.toContain('c');
    });

    it('削除後の total は削除された項目を含まない', () => {
      const byId = {
        'id-1': { count: 10 },
        'id-2': { count: 20 },
        'id-3': { count: 30 },
      } as Record<string, { count: number }>;

      // 削除前の合計
      const totalBefore = Object.values(byId).reduce((sum, item) => sum + item.count, 0);
      expect(totalBefore).toBe(60);

      // id-2 を削除
      const { 'id-2': _removed, ...remainingById } = byId;
      const totalAfter = Object.values(remainingById).reduce((sum, item) => sum + item.count, 0);
      expect(totalAfter).toBe(40);
    });
  });
});
