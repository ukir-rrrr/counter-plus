import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { resetTapSoundForTests, tapSound } from '@/lib/sound';

import { TapSoundDebugPanel } from '../components/TapSoundDebugPanel';
import { useSettingsStore } from '../store';

describe('TapSoundDebugPanel', () => {
  beforeEach(() => {
    resetTapSoundForTests();
    useSettingsStore.setState({ haptics: true, sound: true, keepAwake: true, error: null });
  });

  afterEach(() => {
    resetTapSoundForTests();
  });

  it('空：まだタップがなければその旨を出す', async () => {
    const { getByTestId, getByText, unmount } = await render(<TapSoundDebugPanel />);
    expect(getByTestId('settings-sound-debug')).toBeTruthy();
    expect(getByText('まだタップなし')).toBeTruthy();
    unmount();
  });

  it('通常：タップ後に seq と isLoaded を出す', async () => {
    const { getByText, unmount } = await render(<TapSoundDebugPanel />);
    await act(async () => {
      tapSound();
      for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    await waitFor(() => {
      expect(getByText(/#1 slot=0 loaded=true/)).toBeTruthy();
    });
    unmount();
  });

  it('連打：パネルを押しても落ちない', async () => {
    const { getByTestId, unmount } = await render(<TapSoundDebugPanel />);
    await act(async () => {
      fireEvent.press(getByTestId('settings-sound-debug'));
      fireEvent.press(getByTestId('settings-sound-debug'));
      fireEvent.press(getByTestId('settings-sound-debug'));
      for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    expect(getByTestId('settings-sound-debug')).toBeTruthy();
    unmount();
  });
});
