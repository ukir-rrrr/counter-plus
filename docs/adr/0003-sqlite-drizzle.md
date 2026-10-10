# 0003 保存はSQLite＋Drizzle

- 日付：2026-10-09
- 状態：決定

## 決定
expo-sqliteをDrizzle ORM経由で使う。

## 理由
履歴の集計や並べ替えに強く、型安全に扱える。

## 見送った案
- AsyncStorage / MMKV：キー・バリュー型で、履歴の検索や集計に向かない
