# 0016 公開規約は GitHub Pages（Actions）でホストする

- 日付：2026-10-20
- 状態：決定

## 決定

- App Store Connect 用の利用規約・プライバシーポリシー URL は、公開リポジトリの GitHub Pages で出す。
- 原稿は `docs/legal/`（アプリ内本文 `src/features/legal/content.ts` と一致。CI で確認する）。
- 運営者名・所在地・連絡先・公開 origin は `src/features/legal/publisher.json` を正とし、アプリと Pages 生成スクリプトの両方が読む。
- 静的 HTML は `scripts/build-legal-site.js` が生成する。Jekyll は使わない。
- GitHub Actions（`configure-pages` / `upload-pages-artifact` / `deploy-pages`）で `main` への push のときだけデプロイする。PR では HTML のビルドだけ行う。
- 想定URLは `https://ukir-rrrr.github.io/counter-plus/`（privacy / terms はサブパス）。

## 理由

ストア審査は https で誰でも開けるプライバシーポリシーを要求する。リポジトリは PUBLIC なので Pages は無料で足り、アプリ側にサーバーを持たなくてよい。本文を二重管理でずらさないため、アプリ内の TypeScript を正とし、Markdown 写しとの一致をテストする。

## 見送った案

- 公開 Notion や別サイト: アカウントと更新手順が増える
- Jekyll: テーマとプラグインの管理が増える。Markdown はすでに単純なので素の HTML で足りる
- 規約を Web だけにする: ADR 0015 のとおり、オフラインで読めなくなる
