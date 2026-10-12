export type CsvColumnOptions = {
  includeCategory: boolean;
  includeMemo: boolean;
  includeUpdatedAt: boolean;
};

export type CsvExportRow = {
  categoryName: string;
  name: string;
  count: number;
  memo: string;
  updatedAt: number;
};

export const CSV_LINE_BREAK = '\r\n';
export const UTF8_BOM = '\uFEFF';
export const UTF8_BOM_BYTES = new Uint8Array([0xef, 0xbb, 0xbf]);
export const PREVIEW_DATA_ROWS = 5;

/** チェック欄とCSV見出しで同じ文言（screens.md「最終更新日時」） */
export const CSV_UPDATED_AT_HEADER = '最終更新日時';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** 端末ローカルの YYYY-MM-DD HH:mm（CSVの最終更新） */
export function formatLocalDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 端末ローカルの YYYYMMDD（ファイル名） */
export function formatLocalYmd(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** ファイル名に使えない文字を除く。空白はモックアップどおり詰める */
export function sanitizeFileNamePart(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, '');
  if (cleaned === '') return 'export';
  return cleaned.length > 80 ? cleaned.slice(0, 80) : cleaned;
}

export function buildCsvFileName(scopeKey: 'all' | string, now: number): string {
  const part = scopeKey === 'all' ? 'all' : sanitizeFileNamePart(scopeKey);
  return `counter_${part}_${formatLocalYmd(now)}.csv`;
}

/** RFC 4180：カンマ・引用符・改行を含む値は " で囲み、" は "" にする */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvHeaders(options: CsvColumnOptions): string[] {
  const headers: string[] = [];
  if (options.includeCategory) headers.push('カテゴリ');
  headers.push('項目名', '数');
  if (options.includeMemo) headers.push('メモ');
  if (options.includeUpdatedAt) headers.push(CSV_UPDATED_AT_HEADER);
  return headers;
}

export function csvRowCells(row: CsvExportRow, options: CsvColumnOptions): string[] {
  const cells: string[] = [];
  if (options.includeCategory) cells.push(row.categoryName);
  cells.push(row.name, String(row.count));
  if (options.includeMemo) cells.push(row.memo);
  if (options.includeUpdatedAt) cells.push(formatLocalDateTime(row.updatedAt));
  return cells;
}

/** BOMなしのCSV本文。プレビュー用。行末は Excel 向けに CRLF */
export function buildCsv(rows: CsvExportRow[], options: CsvColumnOptions): string {
  const lines = [csvHeaders(options).map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(csvRowCells(row, options).map(escapeCsvField).join(','));
  }
  return lines.join(CSV_LINE_BREAK) + (lines.length > 0 ? CSV_LINE_BREAK : '');
}

export function csvBytesWithBom(csv: string): Uint8Array {
  const body = new TextEncoder().encode(csv);
  const out = new Uint8Array(UTF8_BOM_BYTES.length + body.length);
  out.set(UTF8_BOM_BYTES, 0);
  out.set(body, UTF8_BOM_BYTES.length);
  return out;
}

export function csvHasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

export function previewLines(csv: string): string[] {
  const raw = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').filter((line, i, arr) => !(line === '' && i === arr.length - 1));
  return lines.slice(0, 1 + PREVIEW_DATA_ROWS);
}
