import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';

export const settingKeys = {
  haptics: 'haptics',
  keepAwake: 'keep_awake',
} as const;

/** app_settings の値を true/false で読む。行が無ければ既定値（設定画面はステップ6） */
export async function getBooleanSetting(key: string, defaultValue: boolean): Promise<boolean> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  if (!row) return defaultValue;
  return row.value === 'true';
}
