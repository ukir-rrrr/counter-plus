import { getBooleanSetting, setBooleanSetting } from '../repository';
import {
  resetSettingsWriteQueueForTests,
  useSettingsStore,
  waitForSettingsWrites,
} from '../store';

jest.mock('../repository', () => ({
  settingKeys: { haptics: 'haptics', sound: 'sound', keepAwake: 'keep_awake' },
  getBooleanSetting: jest.fn(),
  setBooleanSetting: jest.fn(),
}));

const getMock = getBooleanSetting as jest.MockedFunction<typeof getBooleanSetting>;
const setMock = setBooleanSetting as jest.MockedFunction<typeof setBooleanSetting>;

function resetStore() {
  resetSettingsWriteQueueForTests();
  useSettingsStore.setState({
    haptics: true,
    sound: false,
    keepAwake: true,
    error: null,
  });
  getMock.mockReset();
  setMock.mockReset();
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    resetStore();
  });

  afterEach(async () => {
    await waitForSettingsWrites();
    jest.restoreAllMocks();
  });

  it('通常：保存済みの値を読み込む', async () => {
    getMock.mockImplementation((key, fallback) => {
      if (key === 'haptics') return false;
      if (key === 'sound') return true;
      if (key === 'keep_awake') return false;
      return fallback;
    });

    await useSettingsStore.getState().load();

    const state = useSettingsStore.getState();
    expect(state.haptics).toBe(false);
    expect(state.sound).toBe(true);
    expect(state.keepAwake).toBe(false);
    expect(state.error).toBeNull();
  });

  it('空データ：行が無いときは既定値（振動オン・音オフ・消さないオン）', async () => {
    getMock.mockImplementation((_key, fallback) => fallback);

    await useSettingsStore.getState().load();

    const state = useSettingsStore.getState();
    expect(state.haptics).toBe(true);
    expect(state.sound).toBe(false);
    expect(state.keepAwake).toBe(true);
    expect(getMock).toHaveBeenCalledWith('haptics', true);
    expect(getMock).toHaveBeenCalledWith('sound', false);
    expect(getMock).toHaveBeenCalledWith('keep_awake', true);
  });

  it('通常：トグルすると画面を即更新して保存する', async () => {
    useSettingsStore.getState().setHaptics(false);
    expect(useSettingsStore.getState().haptics).toBe(false);

    await waitForSettingsWrites();
    expect(setMock).toHaveBeenCalledWith('haptics', false);
  });

  it('読み込み失敗は error に入れる', async () => {
    getMock.mockImplementation(() => {
      throw new Error('db locked');
    });

    await useSettingsStore.getState().load();

    expect(useSettingsStore.getState().error).toBe('db locked');
    expect(useSettingsStore.getState().haptics).toBe(true);
  });

  it('Error 以外の例外も文言にする', async () => {
    getMock.mockImplementation(() => {
      throw 'boom';
    });

    await useSettingsStore.getState().load();
    expect(useSettingsStore.getState().error).toBe('設定を読み込めませんでした');
  });

  it('保存失敗は DB から読み直す', async () => {
    setMock.mockImplementation(() => {
      throw new Error('disk full');
    });
    getMock.mockImplementation((key, fallback) => {
      if (key === 'haptics') return true;
      return fallback;
    });

    useSettingsStore.getState().setHaptics(false);
    expect(useSettingsStore.getState().haptics).toBe(false);

    await waitForSettingsWrites();
    expect(useSettingsStore.getState().haptics).toBe(true);
  });

  it('連打しても最後の値が残り、書き込みは順番に行われる', async () => {
    const writes: boolean[] = [];
    setMock.mockImplementation((_key, value) => {
      writes.push(value);
    });

    const store = useSettingsStore.getState();
    store.setSound(true);
    store.setSound(false);
    store.setSound(true);
    store.setSound(false);

    expect(useSettingsStore.getState().sound).toBe(false);
    await waitForSettingsWrites();

    expect(writes).toEqual([true, false, true, false]);
    expect(setMock).toHaveBeenLastCalledWith('sound', false);
    expect(useSettingsStore.getState().sound).toBe(false);
  });

  it('画面を消さないの連打でも最終状態が正しい', async () => {
    useSettingsStore.getState().setKeepAwake(false);
    useSettingsStore.getState().setKeepAwake(true);
    useSettingsStore.getState().setKeepAwake(false);

    expect(useSettingsStore.getState().keepAwake).toBe(false);
    await waitForSettingsWrites();
    expect(setMock).toHaveBeenLastCalledWith('keep_awake', false);
  });
});
