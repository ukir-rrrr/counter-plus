import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('counter-plus.db', { enableChangeListener: true });

// カテゴリを消したときに項目と履歴も消えるよう、外部キーを有効にする
expoDb.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

export const db = drizzle(expoDb, { schema });
