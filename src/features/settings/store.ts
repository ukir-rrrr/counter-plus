import { create } from 'zustand';

import { getBooleanSetting, settingKeys } from './repository';

type SettingsState = {
  haptics: boolean;
  keepAwake: boolean;
  load: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  haptics: true,
  keepAwake: true,
  load: async () => {
    const [haptics, keepAwake] = await Promise.all([
      getBooleanSetting(settingKeys.haptics, true),
      getBooleanSetting(settingKeys.keepAwake, true),
    ]);
    set({ haptics, keepAwake });
  },
}));
