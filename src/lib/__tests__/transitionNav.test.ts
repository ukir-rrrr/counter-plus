import { router } from 'expo-router';

import {
  createTransitionNavGate,
  goBackOrReplace,
  subscribeTransitionReady,
} from '../transitionNav';

jest.mock('expo-router', () => ({
  router: {
    canGoBack: jest.fn(() => false),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useNavigation: jest.fn(),
}));

describe('createTransitionNavGate', () => {
  it('通常：遷移前の最初のタップは ready 後に実行する', () => {
    const first = jest.fn();
    const gate = createTransitionNavGate();

    expect(gate.request(first)).toBe('queued');
    expect(first).not.toHaveBeenCalled();

    gate.markReady();
    expect(first).toHaveBeenCalledTimes(1);
    expect(gate.isReady()).toBe(true);
  });

  it('連打：ready 前のタップは最後の1回だけ実行する', () => {
    const first = jest.fn();
    const second = jest.fn();
    const gate = createTransitionNavGate();

    gate.request(first);
    gate.request(second);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    gate.markReady();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(gate.hasPending()).toBe(false);
  });

  it('ready 後のタップはその場で実行する', () => {
    const run = jest.fn();
    const gate = createTransitionNavGate();
    gate.markReady();

    expect(gate.request(run)).toBe('ran');
    expect(gate.request(run)).toBe('ran');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('キュー無しで markReady しても実行しない', () => {
    const run = jest.fn();
    const gate = createTransitionNavGate();
    gate.markReady();
    expect(run).not.toHaveBeenCalled();
  });

  it('markReady の連打ではキュー済みを1回だけ実行する', () => {
    const run = jest.fn();
    const gate = createTransitionNavGate();
    gate.request(run);
    gate.markReady();
    gate.markReady();
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('subscribeTransitionReady', () => {
  it('通常：transitionEnd で最初の戻るタップが実行される', () => {
    const goBack = jest.fn();
    const gate = createTransitionNavGate();
    let listener: (() => void) | undefined;
    const addListener = jest.fn((_event: 'transitionEnd', cb: () => void) => {
      listener = cb;
      return () => {
        listener = undefined;
      };
    });

    const unsubscribe = subscribeTransitionReady(addListener, gate, 10_000, () => 0 as never, () => {});
    gate.request(goBack);
    expect(goBack).not.toHaveBeenCalled();

    listener?.();
    expect(goBack).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('エラー：addListener が失敗してもフォールバックで戻れる', () => {
    jest.useFakeTimers();
    const goBack = jest.fn();
    const gate = createTransitionNavGate();
    const addListener = () => {
      throw new Error('no navigator');
    };

    subscribeTransitionReady(addListener, gate, 400);
    gate.request(goBack);
    expect(goBack).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    expect(goBack).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('連打：transitionEnd 前の戻るは1回だけ実行する', () => {
    const goBack = jest.fn();
    const gate = createTransitionNavGate();
    let listener: (() => void) | undefined;
    subscribeTransitionReady((_event, cb) => {
      listener = cb;
      return () => {};
    }, gate, 10_000, () => 0 as never, () => {});

    gate.request(goBack);
    gate.request(goBack);
    gate.request(goBack);
    expect(goBack).not.toHaveBeenCalled();
    listener?.();
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});

describe('goBackOrReplace', () => {
  const replace = router.replace as jest.MockedFunction<typeof router.replace>;
  const back = router.back as jest.MockedFunction<typeof router.back>;
  const canGoBack = router.canGoBack as jest.MockedFunction<typeof router.canGoBack>;

  beforeEach(() => {
    replace.mockReset();
    back.mockReset();
    canGoBack.mockReset();
    canGoBack.mockReturnValue(false);
  });

  it('通常：navigation が戻れるなら goBack する', () => {
    const navigation = { canGoBack: () => true, goBack: jest.fn() };
    goBackOrReplace(navigation);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('空：戻る先が無いときは replace する', () => {
    const navigation = { canGoBack: () => false, goBack: jest.fn() };
    goBackOrReplace(navigation);
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('エラー相当：canGoBack が false でも router.back が使えれば使う', () => {
    canGoBack.mockReturnValue(true);
    const navigation = { canGoBack: () => false, goBack: jest.fn() };
    goBackOrReplace(navigation);
    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });
});
