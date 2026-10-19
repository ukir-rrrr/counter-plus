/** 画面遷移アニメ中の連打で同じ画面を重ねない。TRANSITION_FALLBACK_MS より少し長め */
export const NAV_LOCK_MS = 800;

type NowFn = () => number;

let nowFn: NowFn = () => Date.now();
let unlockAt = 0;

function now(): number {
  return nowFn();
}

/** ロック中なら false。取れたら holdMs の間、次の遷移を拒否する */
export function tryAcquireNavLock(holdMs: number = NAV_LOCK_MS): boolean {
  const t = now();
  if (t < unlockAt) return false;
  unlockAt = t + holdMs;
  return true;
}

export function isNavLocked(): boolean {
  return now() < unlockAt;
}

export function releaseNavLock(): void {
  unlockAt = 0;
}

/** テスト用。時計を差し替える */
export function setNavLockNowForTests(fn: NowFn | null): void {
  nowFn = fn ?? (() => Date.now());
}

/** テスト用。ロックと時計を戻す */
export function resetNavLockForTests(): void {
  unlockAt = 0;
  nowFn = () => Date.now();
}
