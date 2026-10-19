import {
  NAV_LOCK_MS,
  isNavLocked,
  resetNavLockForTests,
  setNavLockNowForTests,
  tryAcquireNavLock,
} from '../navLock';

describe('navLock', () => {
  beforeEach(() => {
    resetNavLockForTests();
  });

  afterEach(() => {
    resetNavLockForTests();
  });

  it('通常：取れたあと、時間内の2回目は拒否する', () => {
    let t = 1_000_000;
    setNavLockNowForTests(() => t);

    expect(tryAcquireNavLock()).toBe(true);
    expect(isNavLocked()).toBe(true);
    t += 10;
    expect(tryAcquireNavLock()).toBe(false);
    t += NAV_LOCK_MS;
    expect(tryAcquireNavLock()).toBe(true);
  });

  it('microtask 相当の短い待ちではロックが外れない', async () => {
    let t = 2_000_000;
    setNavLockNowForTests(() => t);
    expect(tryAcquireNavLock()).toBe(true);
    await Promise.resolve();
    expect(tryAcquireNavLock()).toBe(false);
  });
});
