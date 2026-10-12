import { useSettingsStore } from '@/features/settings/store';

type SoundPlayer = () => void;

let player: SoundPlayer = () => {};

/** テスト用。タップ音の再生処理を差し替える */
export function setTapSoundPlayerForTests(next: SoundPlayer | null): void {
  player = next ?? (() => {});
}

/** ＋・−を押したときのタップ音（設定がオンのときだけ） */
export function tapSound(): void {
  if (!useSettingsStore.getState().sound) return;
  try {
    player();
  } catch {
    // 再生失敗はカウントを止めない
  }
}
