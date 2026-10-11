import { MAX_COUNT } from '../features/counters/store';

// カウント計算のロジックをテスト（store.ts の applyCount で使われる計算パターン）
function computeCount(currentCount: number, delta: number): number {
  return Math.min(MAX_COUNT, Math.max(0, Math.trunc(currentCount + delta)));
}

describe('computeCount ロジック', () => {
  describe('通常の増減', () => {
    it('増加は正しく計算される', () => {
      expect(computeCount(0, 1)).toBe(1);
      expect(computeCount(5, 3)).toBe(8);
      expect(computeCount(100, 50)).toBe(150);
    });

    it('減少は正しく計算される', () => {
      expect(computeCount(10, -1)).toBe(9);
      expect(computeCount(5, -3)).toBe(2);
      expect(computeCount(100, -50)).toBe(50);
    });

    it('delta=0 は値を変えない', () => {
      expect(computeCount(5, 0)).toBe(5);
      expect(computeCount(0, 0)).toBe(0);
      expect(computeCount(MAX_COUNT, 0)).toBe(MAX_COUNT);
    });
  });

  describe('下限（0）の境界', () => {
    it('0 未満にはならない', () => {
      expect(computeCount(0, -1)).toBe(0);
      expect(computeCount(0, -100)).toBe(0);
      expect(computeCount(5, -10)).toBe(0);
    });

    it('0 からの増加は正常に動作する', () => {
      expect(computeCount(0, 1)).toBe(1);
      expect(computeCount(0, 100)).toBe(100);
    });
  });

  describe('上限（MAX_COUNT）の境界', () => {
    it('MAX_COUNT を超えない', () => {
      expect(computeCount(MAX_COUNT, 1)).toBe(MAX_COUNT);
      expect(computeCount(MAX_COUNT - 1, 2)).toBe(MAX_COUNT);
      expect(computeCount(0, MAX_COUNT + 100)).toBe(MAX_COUNT);
    });

    it('MAX_COUNT からの減少は正常に動作する', () => {
      expect(computeCount(MAX_COUNT, -1)).toBe(MAX_COUNT - 1);
      expect(computeCount(MAX_COUNT, -100)).toBe(MAX_COUNT - 100);
    });

    it('MAX_COUNT への到達は正確である', () => {
      expect(computeCount(MAX_COUNT - 1, 1)).toBe(MAX_COUNT);
      expect(computeCount(0, MAX_COUNT)).toBe(MAX_COUNT);
    });
  });

  describe('小数の切り捨て', () => {
    it('小数は切り捨てられる', () => {
      expect(computeCount(0, 1.9)).toBe(1);
      expect(computeCount(0, 2.5)).toBe(2);
      expect(computeCount(0, 3.1)).toBe(3);
    });

    it('負の小数も正しく処理される', () => {
      // Math.trunc(10 + (-1.9)) = Math.trunc(8.1) = 8
      expect(computeCount(10, -1.9)).toBe(8);
      // Math.trunc(10 + (-2.5)) = Math.trunc(7.5) = 7
      expect(computeCount(10, -2.5)).toBe(7);
    });
  });

  describe('連打シミュレーション', () => {
    it('高速連続インクリメント', () => {
      let count = 0;
      for (let i = 0; i < 1000; i++) {
        count = computeCount(count, 1);
      }
      expect(count).toBe(1000);
    });

    it('高速連続デクリメント（0で止まる）', () => {
      let count = 100;
      for (let i = 0; i < 200; i++) {
        count = computeCount(count, -1);
      }
      expect(count).toBe(0);
    });

    it('交互の増減で正しく計算される', () => {
      let count = 50;
      for (let i = 0; i < 100; i++) {
        count = computeCount(count, 1);
        count = computeCount(count, -1);
      }
      expect(count).toBe(50);
    });

    it('MAX_COUNT 付近での連打', () => {
      let count = MAX_COUNT - 10;
      for (let i = 0; i < 100; i++) {
        count = computeCount(count, 1);
      }
      expect(count).toBe(MAX_COUNT);
    });

    it('±5 ステップの連続操作', () => {
      let count = 100;
      for (let i = 0; i < 20; i++) {
        count = computeCount(count, 5);
      }
      expect(count).toBe(200);

      for (let i = 0; i < 50; i++) {
        count = computeCount(count, -5);
      }
      expect(count).toBe(0);
    });
  });

  describe('直接入力のシナリオ', () => {
    it('任意の値を直接設定できる', () => {
      expect(computeCount(0, 500)).toBe(500);
      expect(computeCount(1000, -1000 + 250)).toBe(250);
    });

    it('大きな値の直接入力は MAX_COUNT に制限される', () => {
      expect(computeCount(0, 1_000_000_000)).toBe(MAX_COUNT);
      expect(computeCount(0, Number.MAX_SAFE_INTEGER)).toBe(MAX_COUNT);
    });

    it('負の値の直接入力は 0 に制限される', () => {
      expect(computeCount(100, -Number.MAX_SAFE_INTEGER)).toBe(0);
    });
  });
});

describe('リセットロジック', () => {
  it('リセットは 0 への設定と同じ', () => {
    expect(computeCount(100, -100)).toBe(0);
    expect(computeCount(MAX_COUNT, -MAX_COUNT)).toBe(0);
  });
});
