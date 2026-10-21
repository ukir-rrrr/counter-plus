import {
  colors,
  itemColorOrder,
  itemColors,
  fonts,
  fontSize,
  radius,
  spacing,
  minTouchSize,
} from '../constants/theme';
import type { ItemColor, ColorScheme } from '../constants/theme';

describe('theme colors', () => {
  describe('light/dark テーマの一貫性', () => {
    it('light と dark で同じキーを持つ', () => {
      const lightKeys = Object.keys(colors.light).sort();
      const darkKeys = Object.keys(colors.dark).sort();
      expect(lightKeys).toEqual(darkKeys);
    });

    it('すべての色が有効な CSS カラー形式である', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      const schemes: ColorScheme[] = ['light', 'dark'];

      for (const scheme of schemes) {
        for (const value of Object.values(colors[scheme])) {
          expect(value).toMatch(hexColorRegex);
        }
      }
    });
  });

  describe('必須の色が定義されている', () => {
    const requiredColors = ['background', 'surface', 'ink', 'accent', 'danger'] as const;

    it.each(requiredColors)('%s が light テーマに存在する', (colorName) => {
      expect(colors.light).toHaveProperty(colorName);
    });

    it.each(requiredColors)('%s が dark テーマに存在する', (colorName) => {
      expect(colors.dark).toHaveProperty(colorName);
    });
  });
});

describe('itemColors', () => {
  it('6色の項目色が定義されている', () => {
    expect(Object.keys(itemColors).length).toBe(6);
  });

  it('すべてが有効な hex カラーである', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const value of Object.values(itemColors)) {
      expect(value).toMatch(hexColorRegex);
    }
  });

  it('gray を含む', () => {
    expect(itemColors).toHaveProperty('gray');
  });

  it('既定色の順は青→緑→オレンジ→紫→赤→グレー', () => {
    expect(itemColorOrder).toEqual(['blue', 'green', 'orange', 'purple', 'red', 'gray']);
    expect([...itemColorOrder].sort()).toEqual((Object.keys(itemColors) as ItemColor[]).sort());
  });

  it('ItemColor 型のキーと一致する', () => {
    const keys = Object.keys(itemColors) as ItemColor[];
    expect(keys).toContain('blue');
    expect(keys).toContain('green');
    expect(keys).toContain('orange');
    expect(keys).toContain('purple');
    expect(keys).toContain('red');
    expect(keys).toContain('gray');
  });
});

describe('fonts', () => {
  it('必須のフォントが定義されている', () => {
    expect(fonts).toHaveProperty('sans');
    expect(fonts).toHaveProperty('sansMedium');
    expect(fonts).toHaveProperty('sansBold');
    expect(fonts).toHaveProperty('monoMedium');
    expect(fonts).toHaveProperty('monoSemibold');
  });

  it('すべて IBM Plex ファミリーを使用している', () => {
    for (const value of Object.values(fonts)) {
      expect(value).toMatch(/^IBMPlex/);
    }
  });
});

describe('fontSize', () => {
  it('title が body より大きい', () => {
    expect(fontSize.title).toBeGreaterThan(fontSize.body);
  });

  it('total が最大のフォントサイズである', () => {
    expect(fontSize.total).toBeGreaterThanOrEqual(fontSize.title);
    expect(fontSize.total).toBeGreaterThanOrEqual(fontSize.count);
    expect(fontSize.total).toBeGreaterThanOrEqual(fontSize.body);
  });

  it('すべてが正の整数である', () => {
    for (const value of Object.values(fontSize)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('radius', () => {
  it('card, control, sheet が定義されている', () => {
    expect(radius).toHaveProperty('card');
    expect(radius).toHaveProperty('control');
    expect(radius).toHaveProperty('sheet');
  });

  it('すべてが正の数である', () => {
    for (const value of Object.values(radius)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('spacing', () => {
  it('screen が定義されている', () => {
    expect(spacing).toHaveProperty('screen');
    expect(spacing.screen).toBe(16);
  });
});

describe('minTouchSize', () => {
  it('44pt 以上である（アクセシビリティ基準）', () => {
    expect(minTouchSize).toBeGreaterThanOrEqual(44);
  });
});
