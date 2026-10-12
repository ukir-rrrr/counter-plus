import {
  UTF8_BOM_BYTES,
  buildCsv,
  buildCsvFileName,
  csvBytesWithBom,
  csvHasUtf8Bom,
  csvHeaders,
  escapeCsvField,
  formatLocalDateTime,
  formatLocalYmd,
  previewLines,
  sanitizeFileNamePart,
  type CsvColumnOptions,
  type CsvExportRow,
} from '../csv';

const allOn: CsvColumnOptions = {
  includeCategory: true,
  includeMemo: true,
  includeUpdatedAt: true,
};

function row(partial: Partial<CsvExportRow> = {}): CsvExportRow {
  return {
    categoryName: '棚 A',
    name: 'マグカップ 白',
    count: 24,
    memo: '棚上段',
    updatedAt: new Date(2026, 9, 9, 18, 42, 0).getTime(),
    ...partial,
  };
}

describe('escapeCsvField', () => {
  it('通常の日本語はそのまま', () => {
    expect(escapeCsvField('マグカップ 白')).toBe('マグカップ 白');
    expect(escapeCsvField('棚上段')).toBe('棚上段');
  });

  it('カンマを含む値は引用符で囲む', () => {
    expect(escapeCsvField('マグカップ, 白')).toBe('"マグカップ, 白"');
  });

  it('引用符は二重にして囲む', () => {
    expect(escapeCsvField('曰く"特価"')).toBe('"曰く""特価"""');
  });

  it('LF / CR / CRLF を含むメモをエスケープする', () => {
    expect(escapeCsvField('棚上段\n奥')).toBe('"棚上段\n奥"');
    expect(escapeCsvField('棚上段\r奥')).toBe('"棚上段\r奥"');
    expect(escapeCsvField('棚上段\r\n奥')).toBe('"棚上段\r\n奥"');
  });

  it('空文字はそのまま', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

describe('formatLocalDateTime / formatLocalYmd（日付境界・ローカル）', () => {
  it('最終更新はローカルの YYYY-MM-DD HH:mm', () => {
    expect(formatLocalDateTime(new Date(2026, 9, 9, 18, 42, 0).getTime())).toBe('2026-10-09 18:42');
    expect(formatLocalDateTime(new Date(2026, 9, 9, 0, 0, 0).getTime())).toBe('2026-10-09 00:00');
    expect(formatLocalDateTime(new Date(2026, 9, 9, 23, 59, 0).getTime())).toBe('2026-10-09 23:59');
  });

  it('ファイル名の日付はローカルの YYYYMMDD。0:00 と 23:59 は同じ日', () => {
    expect(formatLocalYmd(new Date(2026, 9, 9, 0, 0, 0).getTime())).toBe('20261009');
    expect(formatLocalYmd(new Date(2026, 9, 9, 23, 59, 59).getTime())).toBe('20261009');
    expect(formatLocalYmd(new Date(2026, 9, 8, 23, 59, 0).getTime())).toBe('20261008');
  });

  it('UTC ミリ秒でもローカル日付で切る', () => {
    const utcMs = Date.UTC(2026, 9, 9, 15, 30, 0);
    const local = new Date(utcMs);
    const expected = `${local.getFullYear()}${String(local.getMonth() + 1).padStart(2, '0')}${String(local.getDate()).padStart(2, '0')}`;
    expect(formatLocalYmd(utcMs)).toBe(expected);
  });
});

describe('sanitizeFileNamePart / buildCsvFileName', () => {
  const now = new Date(2026, 9, 9, 18, 42, 0).getTime();

  it('すべて は all、カテゴリ名は空白を詰める', () => {
    expect(buildCsvFileName('all', now)).toBe('counter_all_20261009.csv');
    expect(buildCsvFileName('棚 A', now)).toBe('counter_棚A_20261009.csv');
    expect(buildCsvFileName('カテゴリ 1', now)).toBe('counter_カテゴリ1_20261009.csv');
  });

  it('パス区切りや予約文字を落とす。空なら export', () => {
    expect(sanitizeFileNamePart('棚/A:B*C?')).toBe('棚ABC');
    expect(sanitizeFileNamePart('   ')).toBe('export');
    expect(sanitizeFileNamePart('')).toBe('export');
  });
});

describe('buildCsv', () => {
  it('列の組み合わせどおりヘッダと行を出す', () => {
    const csv = buildCsv([row()], allOn);
    expect(csv.startsWith('カテゴリ,項目名,数,メモ,最終更新\r\n')).toBe(true);
    expect(csv).toContain('棚 A,マグカップ 白,24,棚上段,2026-10-09 18:42\r\n');
  });

  it('任意列を外せる。項目名と数は残る', () => {
    const csv = buildCsv([row()], {
      includeCategory: false,
      includeMemo: false,
      includeUpdatedAt: false,
    });
    expect(csvHeaders({ includeCategory: false, includeMemo: false, includeUpdatedAt: false })).toEqual([
      '項目名',
      '数',
    ]);
    expect(csv).toBe('項目名,数\r\nマグカップ 白,24\r\n');
  });

  it('空の範囲はヘッダだけ（末尾 CRLF）', () => {
    const csv = buildCsv([], { includeCategory: true, includeMemo: true, includeUpdatedAt: false });
    expect(csv).toBe('カテゴリ,項目名,数,メモ\r\n');
  });

  it('名前とメモのカンマ・引用符・改行をエスケープする', () => {
    const csv = buildCsv(
      [
        row({
          name: 'マグ,カップ',
          memo: '上段\n"特価"',
        }),
      ],
      { includeCategory: false, includeMemo: true, includeUpdatedAt: false },
    );
    expect(csv).toBe('項目名,数,メモ\r\n"マグ,カップ",24,"上段\n""特価"""\r\n');
  });

  it('日本語のカテゴリ・項目・メモがそのまま入る', () => {
    const csv = buildCsv(
      [row({ categoryName: '棚 Ｂ', name: 'アロマキャンドル', memo: 'レジ横' })],
      { includeCategory: true, includeMemo: true, includeUpdatedAt: false },
    );
    expect(csv).toContain('棚 Ｂ,アロマキャンドル,24,レジ横');
  });
});

describe('BOM', () => {
  it('UTF-8 BOM (EF BB BF) を先頭に付ける', () => {
    const csv = buildCsv([], { includeCategory: false, includeMemo: false, includeUpdatedAt: false });
    const bytes = csvBytesWithBom(csv);
    expect(csvHasUtf8Bom(bytes)).toBe(true);
    expect([...bytes.slice(0, 3)]).toEqual([...UTF8_BOM_BYTES]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe(csv);
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
  });

  it('日本語を含む本文も BOM の後ろで壊さない', () => {
    const csv = '項目名,数\r\nマグカップ 白,1\r\n';
    const decoded = new TextDecoder().decode(csvBytesWithBom(csv).slice(3));
    expect(decoded).toBe(csv);
  });
});

describe('previewLines', () => {
  it('ヘッダ＋先頭5行。空範囲はヘッダだけ', () => {
    expect(previewLines('カテゴリ,項目名,数\r\n')).toEqual(['カテゴリ,項目名,数']);
    const many = ['H', '1', '2', '3', '4', '5', '6', '7'].join('\r\n') + '\r\n';
    expect(previewLines(many)).toEqual(['H', '1', '2', '3', '4', '5']);
  });
});
