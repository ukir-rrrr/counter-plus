import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

/** 画面遷移アニメ中の back は React Navigation に捨てられることがある */

export const TRANSITION_FALLBACK_MS = 400;

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

export type TransitionNavGate = ReturnType<typeof createTransitionNavGate>;

/**
 * プッシュアニメの transitionEnd でゲートを開ける。
 * InteractionManager は早すぎて goBack が捨てられることがある。
 */
export function subscribeTransitionReady(
  addListener: (event: 'transitionEnd', cb: () => void) => () => void,
  gate: TransitionNavGate,
  fallbackMs = TRANSITION_FALLBACK_MS,
  schedule: (fn: () => void, ms: number) => unknown = setTimeout,
  clearSchedule: (id: unknown) => void = (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
): () => void {
  let unsubscribe = () => {};
  try {
    unsubscribe = addListener('transitionEnd', () => {
      gate.markReady();
    });
  } catch {
    // リスナーが無い環境でもフォールバックで戻れる
  }
  const timer = schedule(() => gate.markReady(), fallbackMs);
  return () => {
    unsubscribe();
    clearSchedule(timer);
  };
}

export function goBackOrReplace(navigation: {
  canGoBack: () => boolean;
  goBack: () => void;
}): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}

type StackBackNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  addListener: (event: 'transitionEnd', cb: () => void) => () => void;
};

/** 設定・履歴の戻る。初回タップをキューし、遷移完了後に必ず実行する */
export function useTransitionBack() {
  const navigation = useNavigation() as unknown as StackBackNavigation;
  const [gate] = useState(() => createTransitionNavGate());

  useEffect(() => {
    return subscribeTransitionReady((event, cb) => navigation.addListener(event, cb), gate);
  }, [gate, navigation]);

  return () => {
    gate.request(() => goBackOrReplace(navigation));
  };
}
