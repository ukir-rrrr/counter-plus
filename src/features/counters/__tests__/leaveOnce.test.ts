import { claimLeave } from '../leaveOnce';

describe('claimLeave', () => {
  it('最初の1回だけ true を返し、leaving を立てる', () => {
    const leaving = { current: false };
    expect(claimLeave(leaving)).toBe(true);
    expect(leaving.current).toBe(true);
  });

  it('2回目以降は false を返し、二重ナビゲートしない', () => {
    const leaving = { current: false };
    expect(claimLeave(leaving)).toBe(true);
    expect(claimLeave(leaving)).toBe(false);
    expect(claimLeave(leaving)).toBe(false);
    expect(leaving.current).toBe(true);
  });

  it('すでに leaving なら最初から false', () => {
    const leaving = { current: true };
    expect(claimLeave(leaving)).toBe(false);
  });

  it('削除→counter消滅の useEffect を模した連打でもナビゲートは1回', () => {
    const leaving = { current: false };
    let navigations = 0;

    const navigateAway = () => {
      navigations += 1;
    };

    // Alert の「削除」
    if (claimLeave(leaving)) {
      navigateAway();
    }
    // remove 後に counter が undefined になり useEffect が leave() 相当を呼ぶ
    if (claimLeave(leaving)) {
      navigateAway();
    }
    // BottomSheet の onClose が遅れて発火した場合
    if (claimLeave(leaving)) {
      navigateAway();
    }

    expect(navigations).toBe(1);
  });
});
