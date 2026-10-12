import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { csvBytesWithBom } from './csv';

export type ShareCsvReason = 'busy' | 'unavailable' | 'write' | 'share';

export type ShareCsvResult = { ok: true } | { ok: false; reason: ShareCsvReason; message?: string };

export type CsvFileWriter = {
  isAvailable: () => Promise<boolean>;
  writeCsv: (fileName: string, bytes: Uint8Array) => Promise<string>;
  share: (uri: string, fileName: string) => Promise<void>;
};

export const defaultCsvFileWriter: CsvFileWriter = {
  isAvailable: () => Sharing.isAvailableAsync(),
  writeCsv: async (fileName, bytes) => {
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(bytes);
    return file.uri;
  },
  share: async (uri, fileName) => {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: fileName,
    });
  },
};

let inFlight = false;

/** テスト用。連打ロックを戻す */
export function resetShareLockForTests(): void {
  inFlight = false;
}

export function isShareInFlight(): boolean {
  return inFlight;
}

/**
 * UTF-8 BOM付きで書いて共有シートを開く。
 * 連打されても同時に1回だけ実行する。
 */
export async function shareCsvFile(
  fileName: string,
  csv: string,
  writer: CsvFileWriter = defaultCsvFileWriter,
): Promise<ShareCsvResult> {
  if (inFlight) return { ok: false, reason: 'busy' };
  inFlight = true;
  try {
    const available = await writer.isAvailable();
    if (!available) return { ok: false, reason: 'unavailable' };

    let uri: string;
    try {
      uri = await writer.writeCsv(fileName, csvBytesWithBom(csv));
    } catch (e: unknown) {
      return {
        ok: false,
        reason: 'write',
        message: e instanceof Error ? e.message : 'ファイルを書けませんでした',
      };
    }

    try {
      await writer.share(uri, fileName);
      return { ok: true };
    } catch (e: unknown) {
      return {
        ok: false,
        reason: 'share',
        message: e instanceof Error ? e.message : '共有シートを開けませんでした',
      };
    }
  } finally {
    inFlight = false;
  }
}
