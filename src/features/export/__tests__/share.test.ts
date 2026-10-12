import { csvBytesWithBom } from '../csv';
import {
  isShareInFlight,
  resetShareLockForTests,
  shareCsvFile,
  type CsvFileWriter,
} from '../share';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockWriter(overrides: Partial<CsvFileWriter> = {}): CsvFileWriter {
  return {
    isAvailable: jest.fn(async () => true),
    writeCsv: jest.fn(async () => 'file:///tmp/out.csv'),
    share: jest.fn(async () => {}),
    ...overrides,
  };
}

describe('shareCsvFile', () => {
  beforeEach(() => {
    resetShareLockForTests();
  });

  it('通常：BOM付きで書いて共有シートを開く', async () => {
    const writer = mockWriter();
    const csv = '項目名,数\r\nA,1\r\n';
    const result = await shareCsvFile('counter_all_20261009.csv', csv, writer);
    expect(result).toEqual({ ok: true });
    expect(writer.writeCsv).toHaveBeenCalledTimes(1);
    const bytes = (writer.writeCsv as jest.Mock).mock.calls[0][1] as Uint8Array;
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe(csv);
    expect(bytes).toEqual(csvBytesWithBom(csv));
    expect(writer.share).toHaveBeenCalledWith('file:///tmp/out.csv', 'counter_all_20261009.csv');
  });

  it('空の範囲（ヘッダのみ）も書き出せる', async () => {
    const writer = mockWriter();
    const result = await shareCsvFile('counter_棚A_20261009.csv', 'カテゴリ,項目名,数\r\n', writer);
    expect(result).toEqual({ ok: true });
    expect(writer.writeCsv).toHaveBeenCalled();
  });

  it('共有が使えない端末は unavailable', async () => {
    const writer = mockWriter({ isAvailable: jest.fn(async () => false) });
    const result = await shareCsvFile('a.csv', 'x', writer);
    expect(result).toEqual({ ok: false, reason: 'unavailable' });
    expect(writer.writeCsv).not.toHaveBeenCalled();
  });

  it('書き込み失敗は write', async () => {
    const writer = mockWriter({
      writeCsv: jest.fn(async () => {
        throw new Error('disk full');
      }),
    });
    const result = await shareCsvFile('a.csv', 'x', writer);
    expect(result).toMatchObject({ ok: false, reason: 'write', message: 'disk full' });
    expect(writer.share).not.toHaveBeenCalled();
  });

  it('共有シート失敗は share', async () => {
    const writer = mockWriter({
      share: jest.fn(async () => {
        throw new Error('user cancelled?');
      }),
    });
    const result = await shareCsvFile('a.csv', 'x', writer);
    expect(result).toMatchObject({ ok: false, reason: 'share' });
  });

  it('連打しても共有は1回。2回目以降は busy', async () => {
    const gate = deferred<string>();
    const writer = mockWriter({
      writeCsv: jest.fn(() => gate.promise),
    });

    const first = shareCsvFile('a.csv', 'x', writer);
    const extras = await Promise.all([
      shareCsvFile('a.csv', 'x', writer),
      shareCsvFile('a.csv', 'x', writer),
      shareCsvFile('a.csv', 'x', writer),
    ]);

    expect(isShareInFlight()).toBe(true);
    expect(extras.every((r) => r.ok === false && r.reason === 'busy')).toBe(true);
    expect(writer.writeCsv).toHaveBeenCalledTimes(1);

    gate.resolve('file:///tmp/out.csv');
    await expect(first).resolves.toEqual({ ok: true });
    expect(isShareInFlight()).toBe(false);

    const after = await shareCsvFile('a.csv', 'x', writer);
    expect(after).toEqual({ ok: true });
    expect(writer.writeCsv).toHaveBeenCalledTimes(2);
  });
});
