import { itemColorOrder, itemColors } from '@/constants/theme';

import { nextDefaultItemColor } from '../defaultColor';

describe('nextDefaultItemColor', () => {
  it('パレットは screens.md の順（先頭は青）', () => {
    expect(itemColorOrder).toEqual(['blue', 'green', 'orange', 'purple', 'red', 'gray']);
    expect([...itemColorOrder].sort()).toEqual(Object.keys(itemColors).sort());
  });

  it('カテゴリ内の件数で循環し、0件目は青', () => {
    expect(nextDefaultItemColor(0)).toBe('blue');
    expect(nextDefaultItemColor(1)).toBe('green');
    expect(nextDefaultItemColor(2)).toBe('orange');
    expect(nextDefaultItemColor(3)).toBe('purple');
    expect(nextDefaultItemColor(4)).toBe('red');
    expect(nextDefaultItemColor(5)).toBe('gray');
    expect(nextDefaultItemColor(6)).toBe('blue');
    expect(nextDefaultItemColor(7)).toBe('green');
  });

  it('不正な件数は0件扱い（先頭の青）', () => {
    expect(nextDefaultItemColor(-1)).toBe('blue');
    expect(nextDefaultItemColor(1.9)).toBe('green');
    expect(nextDefaultItemColor(Number.NaN)).toBe('blue');
  });
});
