import { newId } from '../db/id';

describe('newId', () => {
  it('文字列を返す', () => {
    const id = newId();
    expect(typeof id).toBe('string');
  });

  it('空でない文字列を返す', () => {
    const id = newId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('呼び出すたびに異なる ID を返す', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(newId());
    }
    expect(ids.size).toBe(100);
  });

  describe('連打テスト（高速連続生成）', () => {
    it('1000回連続で呼び出しても衝突しない', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(newId());
      }
      expect(ids.size).toBe(1000);
    });

    it('同期的に連続生成しても一意性が保たれる', () => {
      const ids = Array.from({ length: 500 }, () => newId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
