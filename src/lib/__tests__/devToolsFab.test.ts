import * as DevClient from 'expo-dev-client';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { setDevToolsFabVisible, shouldHideDevToolsFab } from '../devToolsFab';

const setPreferencesAsync = jest.fn(async () => {});
const setToolsButtonVisible = (DevClient as unknown as { setToolsButtonVisible: jest.Mock })
  .setToolsButtonVisible;

describe('devToolsFab', () => {
  beforeEach(() => {
    setToolsButtonVisible.mockClear();
    setPreferencesAsync.mockClear();
    (requireOptionalNativeModule as jest.Mock).mockReturnValue({ setPreferencesAsync });
  });

  it('購入画面と編集シートでは隠す', () => {
    expect(shouldHideDevToolsFab('/paywall')).toBe(true);
    expect(shouldHideDevToolsFab('/counter/abc')).toBe(true);
    expect(shouldHideDevToolsFab('/')).toBe(false);
    expect(shouldHideDevToolsFab('/settings')).toBe(false);
  });

  it('開発クライアントと DevMenuPreferences の両方で FAB を切り替える', () => {
    setDevToolsFabVisible(false);
    expect(setToolsButtonVisible).toHaveBeenCalledWith(false);
    expect(setPreferencesAsync).toHaveBeenCalledWith({ showFloatingActionButton: false });

    setDevToolsFabVisible(true);
    expect(setToolsButtonVisible).toHaveBeenCalledWith(true);
    expect(setPreferencesAsync).toHaveBeenCalledWith({ showFloatingActionButton: true });
  });

  it('ネイティブが無くても落ちない', () => {
    (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
    expect(() => setDevToolsFabVisible(false)).not.toThrow();
  });
});
