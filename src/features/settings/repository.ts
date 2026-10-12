import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';

import { parseBooleanSetting, serializeBooleanSetting } from './boolean';

export const settingKeys = {
  haptics: 'haptics',
  sound: 'sound',
  keepAwake: 'keep_awake',
} as const;

export type SettingKey = (typeof settingKeys)[keyof typeof settingKeys];

/** app_settings の値を true/false で読む。行が無ければ既定値 */
export function getBooleanSetting(key: string, defaultValue: boolean): boolean {
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
  return parseBooleanSetting(row?.value, defaultValue);
}

/** 同じキーがあれば上書き、無ければ追加する */
export function setBooleanSetting(key: string, value: boolean): void {
  const serialized = serializeBooleanSetting(value);
  const existing = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
  if (existing) {
    db.update(appSettings).set({ value: serialized }).where(eq(appSettings.key, key)).run();
    return;
  }
  db.insert(appSettings).values({ key, value: serialized }).run();
}
