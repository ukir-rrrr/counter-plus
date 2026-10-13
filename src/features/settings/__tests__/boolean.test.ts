import { parseBooleanSetting, serializeBooleanSetting } from '../boolean';

describe('parseBooleanSetting', () => {
  it('通常：true / false をそのまま返す', () => {
    expect(parseBooleanSetting('true', false)).toBe(true);
    expect(parseBooleanSetting('false', true)).toBe(false);
  });

  it('空データ：行なし・空文字は既定値', () => {
    expect(parseBooleanSetting(undefined, true)).toBe(true);
    expect(parseBooleanSetting(null, false)).toBe(false);
    expect(parseBooleanSetting('', true)).toBe(true);
    expect(parseBooleanSetting('', false)).toBe(false);
  });

  it('不正な値は既定値に戻す', () => {
    expect(parseBooleanSetting('yes', true)).toBe(true);
    expect(parseBooleanSetting('TRUE', false)).toBe(false);
    expect(parseBooleanSetting('1', true)).toBe(true);
  });
});

describe('serializeBooleanSetting', () => {
  it('boolean を TEXT に変換する', () => {
    expect(serializeBooleanSetting(true)).toBe('true');
    expect(serializeBooleanSetting(false)).toBe('false');
  });
});
