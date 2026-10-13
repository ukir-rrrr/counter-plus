import { act, fireEvent, render } from '@testing-library/react-native';

import { SettingsToggle } from '../components/SettingsToggle';

describe('SettingsToggle', () => {
  it('通常：タップで反転する', async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await render(
      <SettingsToggle
        testID="settings-toggle-haptics"
        label="タップ時の振動"
        description="＋・−を押したときに軽く振動"
        value={true}
        onValueChange={onValueChange}
        last
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('settings-toggle-haptics'));
    });
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('オフの表示でもタップでオンになる', async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await render(
      <SettingsToggle
        testID="settings-toggle-keep-awake"
        label="画面を消さない"
        description="数えている間は画面を点けたまま"
        value={false}
        onValueChange={onValueChange}
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('settings-toggle-keep-awake'));
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('連打：毎回 onValueChange が呼ばれる', async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await render(
      <SettingsToggle
        testID="settings-toggle-keep-awake"
        label="画面を消さない"
        description="数えている間は画面を点けたまま"
        value={true}
        onValueChange={onValueChange}
        last
      />,
    );

    const toggle = getByTestId('settings-toggle-keep-awake');
    await act(async () => {
      fireEvent.press(toggle);
      fireEvent.press(toggle);
      fireEvent.press(toggle);
    });
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(onValueChange).toHaveBeenNthCalledWith(1, false);
    expect(onValueChange).toHaveBeenNthCalledWith(2, false);
    expect(onValueChange).toHaveBeenNthCalledWith(3, false);
  });
});
