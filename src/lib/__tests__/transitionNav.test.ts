import { createTransitionNavGate } from '../transitionNav';

describe('createTransitionNavGate', () => {
  it('遷移前のタップはキューし、ready 後に最後のアクションを1回実行する', () => {
    const first = jest.fn();
    const second = jest.fn();
    const gate = createTransitionNavGate();

    expect(gate.request(first)).toBe('queued');
    expect(gate.request(second)).toBe('queued');
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(gate.hasPending()).toBe(true);

    gate.markReady();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(gate.isReady()).toBe(true);
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
