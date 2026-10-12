import { create } from 'zustand';

import { getBooleanSetting, setBooleanSetting, settingKeys } from './repository';

type SettingsState = {
  haptics: boolean;
  sound: boolean;
  keepAwake: boolean;
  error: string | null;
  load: () => Promise<void>;
  setHaptics: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setKeepAwake: (value: boolean) => void;
};

// 書き込みは1件ずつ順番に行う。連打しても最後の値が残る
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(write: () => void, onError: () => void): void {
  writeQueue = writeQueue
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    .then(write)
    .catch((e: unknown) => {
      console.warn('設定を保存できませんでした', e);
      onError();
    });
}

async function waitForWrites(): Promise<void> {
  let current: Promise<void>;
  do {
    current = writeQueue;
    await current;
  } while (current !== writeQueue);
}

/** 未完了の書き込みが終わるまで待つ */
export async function waitForSettingsWrites(): Promise<void> {
  await waitForWrites();
}

/** テスト用。キューを空に戻す */
export function resetSettingsWriteQueueForTests(): void {
  writeQueue = Promise.resolve();
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  function persist(key: string, value: boolean, apply: () => void): void {
    apply();
    enqueueWrite(
      () => setBooleanSetting(key, value),
      () => {
        get().load();
      },
    );
  }

  return {
    haptics: true,
    sound: false,
    keepAwake: true,
    error: null,
    load: async () => {
      try {
        await waitForWrites();
        set({
          haptics: getBooleanSetting(settingKeys.haptics, true),
          sound: getBooleanSetting(settingKeys.sound, false),
          keepAwake: getBooleanSetting(settingKeys.keepAwake, true),
          error: null,
        });
      } catch (e: unknown) {
        console.warn('設定を読み込めませんでした', e);
        set({
          error: e instanceof Error ? e.message : '設定を読み込めませんでした',
        });
      }
    },
    setHaptics: (value) => {
      persist(settingKeys.haptics, value, () => set({ haptics: value }));
    },
    setSound: (value) => {
      persist(settingKeys.sound, value, () => set({ sound: value }));
    },
    setKeepAwake: (value) => {
      persist(settingKeys.keepAwake, value, () => set({ keepAwake: value }));
    },
  };
});
