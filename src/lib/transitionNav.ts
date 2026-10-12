/** 画面遷移アニメ中の back は React Navigation に捨てられることがある */

export function createTransitionNavGate() {
  let ready = false;
  let pending: (() => void) | null = null;

  return {
    markReady(): void {
      ready = true;
      const fn = pending;
      pending = null;
      fn?.();
    },
    request(run: () => void): 'queued' | 'ran' {
      if (!ready) {
        pending = run;
        return 'queued';
      }
      run();
      return 'ran';
    },
    isReady(): boolean {
      return ready;
    },
    hasPending(): boolean {
      return pending != null;
    },
  };
}
