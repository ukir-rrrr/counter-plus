import { getOptionalBooleanSetting, setBooleanSetting } from '@/features/settings/repository';

import { CACHED_IS_PRO_KEY, readCachedIsPro, writeCachedIsPro } from '../entitlementCache';

jest.mock('@/features/settings/repository', () => ({
  getOptionalBooleanSetting: jest.fn(),
  setBooleanSetting: jest.fn(),
}));

describe('entitlementCache', () => {
  beforeEach(() => {
    (getOptionalBooleanSetting as jest.Mock).mockReset();
    (setBooleanSetting as jest.Mock).mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('通常：保存した Pro を読む', () => {
    (getOptionalBooleanSetting as jest.Mock).mockReturnValue(true);
    expect(readCachedIsPro()).toBe(true);
    expect(getOptionalBooleanSetting).toHaveBeenCalledWith(CACHED_IS_PRO_KEY);

    writeCachedIsPro(false);
    expect(setBooleanSetting).toHaveBeenCalledWith(CACHED_IS_PRO_KEY, false);
  });

  it('空データ：キャッシュが無ければ null', () => {
    (getOptionalBooleanSetting as jest.Mock).mockReturnValue(null);
    expect(readCachedIsPro()).toBeNull();
  });

  it('エラー：読み込み失敗は null、書き込み失敗は投げない', () => {
    (getOptionalBooleanSetting as jest.Mock).mockImplementation(() => {
      throw new Error('db');
    });
    expect(readCachedIsPro()).toBeNull();

    (setBooleanSetting as jest.Mock).mockImplementation(() => {
      throw new Error('db');
    });
    expect(() => writeCachedIsPro(true)).not.toThrow();
  });
});
