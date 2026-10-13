/** app_settings の value（TEXT）と boolean の変換。行が無い・空・不正は既定値 */

export function parseBooleanSetting(value: string | null | undefined, defaultValue: boolean): boolean {
  if (value == null || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

export function serializeBooleanSetting(value: boolean): string {
  return value ? 'true' : 'false';
}

/** 行が無い・空・不正は「未キャッシュ」 */
export function parseOptionalBooleanSetting(value: string | null | undefined): boolean | null {
  if (value == null || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}
