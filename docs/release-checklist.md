# リリースチェックリスト（オーナー作業）

コード側のステップ9（アイコン、規約画面、EASプロファイル、掲載文案）が揃ったあとに、**この順**でアカウント作業を行う。`eas submit` やストアのレコード作成は、このリストを見ながらオーナーが実行する。エージェントは実行しない。

関連資料: `docs/revenuecat-setup.md` / `docs/ads-analytics-setup.md` / `docs/app-store-listing.md` / `docs/legal/`

## 0. 前提

- Apple Developer Program に入っている
- EAS プロジェクト `counter-plus`（owner: `chestnut_ukir`）がある
- Bundle ID は `com.chestnutukir.counterplus`
- 商品IDは `pro_lifetime`、RevenueCat の Entitlement は `pro`

## 1. 公開用の利用規約・プライバシーポリシーをホストする

App Store Connect は **https で誰でも開けるプライバシーポリシー URL** を要求する。アプリ内画面だけでは不足する。

公開は GitHub Pages（`main` への push で `.github/workflows/pages.yml` が `docs/legal/` から静的 HTML を出す）。初回だけ、リポジトリの **Settings → Pages → Build and deployment → Source を GitHub Actions** にする（オーナー作業。マージや提出はしない）。

| 用途 | URL |
| --- | --- |
| トップ（サポートURL） | https://ukir-rrrr.github.io/counter-plus/ |
| プライバシーポリシーURL | https://ukir-rrrr.github.io/counter-plus/privacy/ |
| 利用規約URL | https://ukir-rrrr.github.io/counter-plus/terms/ |

App Store Connect に入れる値:

- **プライバシーポリシーURL**（必須）: `https://ukir-rrrr.github.io/counter-plus/privacy/`
- **サポートURL**: `https://ukir-rrrr.github.io/counter-plus/`（トップ。問い合わせ先もここに記載）
- **利用規約URL**（IAP があるので推奨）: `https://ukir-rrrr.github.io/counter-plus/terms/`

文面の正は `src/features/legal/content.ts`。`docs/legal/` は同じ本文の写しで、CI が一致を確認する。直すときは両方を同じ内容にする。

お問い合わせメールは `aba929559@gmail.com`。EAS の `EXPO_PUBLIC_SUPPORT_EMAIL` にも同じ値を入れる。

## 2. EAS の環境変数を入れる

[Environment variables](https://docs.expo.dev/eas/environment-variables/) に入れる。`eas.json` に実キーを書かない。

`eas.json` の `environment` は development / preview / production に対応している。

| 変数 | development | preview | production |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | 公開キー | 公開キー | 公開キー |
| `EXPO_PUBLIC_ADMOB_IOS_APP_ID` | テストApp IDでも可 | テストまたは本番 | **本番のみ**（テストIDだとビルドが失敗する） |
| `EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID` | 未設定でよい（開発中はコードがテストユニットIDを使う） | 任意 | **本番ユニットID** |
| `EXPO_PUBLIC_ADMOB_ANDROID_*` | Android出すまで空でよい | 空でよい | 空でよい（iPhoneのみ） |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | 開発プロジェクトでも可 | 任意 | 本番プロジェクト |
| `EXPO_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` など | 同左 | 同左 |
| `EXPO_PUBLIC_APP_STORE_ID` | 空でも可 | 数字のApple ID | 数字のApple ID（レビューリンク用） |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | `aba929559@gmail.com` | 同じ | 同じ（お問い合わせの mailto） |

production の AdMob App ID に Google サンプル（`ca-app-pub-3940256099942544~…`）を入れると、設定の段階でエラーにする。

ローカル確認は `.env`（Git管理外）。`.env.example` はキー名と、お問い合わせメールの例だけ。

## 3. App Store Connect — アプリ本体

1. 新規アプリを作る（まだなら）。プラットフォーム iOS、Bundle ID `com.chestnutukir.counterplus`、言語は日本語
2. SKU は内部用（例: `counterplus`）
3. 作成後に表示される **Apple ID（数字）** を控える → `EXPO_PUBLIC_APP_STORE_ID`
4. カテゴリ: 例「ビジネス」または「ユーティリティ」。年齢制限は広告ありのためアンケートに正直に答える
5. 価格: アプリ本体は無料。IAP が有料

## 4. App Store Connect — アプリ内課金

手順の詳細は `docs/revenuecat-setup.md`。

1. 有料アプリケーション契約・税務・口座を完了する（これがないとサンドボックスも購入できないことがある）
2. 消費しない（Non-Consumable）`pro_lifetime` を作る
3. 日本語の表示名と説明、価格（目安 ¥800）
4. IAP 用のスクリーンショット（購入画面で可）
5. 審査提出前に IAP を「提出準備完了」にする

## 5. RevenueCat

`docs/revenuecat-setup.md` のとおり。公開キーだけを EAS の production に入れる。Secret API key はアプリに入れない。

Sandbox テスターを App Store Connect で作り、実機の設定 → App Store → Sandboxアカウントで切り替える。

## 6. AdMob / ATT / PostHog

`docs/ads-analytics-setup.md` のとおり。

- AdMob に iOS アプリとバナー（アダプティブ）を1つ
- 本番の App ID / ユニットIDを EAS production にだけ入れる
- PostHog で本番プロジェクトを作り、autocapture とセッションリプレイはオフ
- ATT の文言はアプリ設定に日本語で入っている。実機の「トラッキングを許可」がオフだとダイアログは出ない

## 7. App Store のプライバシー（ニュートリションラベル）

「アプリのプライバシー」で、実装に合わせて申告する。目安:

| データ | 用途 | ユーザーに紐づけるか | トラッキングに使うか |
| --- | --- | --- | --- |
| 広告データ | サードパーティ広告 | 紐づけない | ATT 許可時のみ |
| デバイスID（広告識別子） | サードパーティ広告 | 紐づけない | ATT 許可時のみ |
| 製品とのやり取り | アナリティクス | 紐づけない | 使わない |
| 購入履歴 | アプリの機能（購入状態） | 紐づけない | 使わない |

- トラッキング: AdMob のパーソナライズ広告（ATT 許可時）
- アカウント・連絡先・名前は収集しない
- プライバシーポリシーURL: `https://ukir-rrrr.github.io/counter-plus/privacy/`（必須）
- 利用規約URL: `https://ukir-rrrr.github.io/counter-plus/terms/`（IAP があるので推奨）

## 8. 掲載メタデータ

`docs/app-store-listing.md` をコピーする。

- 名前 / サブタイトル / 説明 / キーワード / What's New
- サポートURL: `https://ukir-rrrr.github.io/counter-plus/`（マーケティングURLは任意）
- 著作権表記
- 連絡先メール: `aba929559@gmail.com`（`EXPO_PUBLIC_SUPPORT_EMAIL` と同じ）

## 9. 審査メモ（IAP・広告）

「メモ」に日本語または英語で、審査員が試せる内容を書く。例:

- アプリ本体は無料。カウントはアカウントなしで使える
- 買い切り IAP `pro_lifetime`（RevenueCat Entitlement `pro`）。設定と購入画面に「購入を復元」がある
- 審査用: Sandbox で Pro を購入すると、広告が消え、履歴・CSV・カテゴリ追加・自動並べ替えが使える
- バナー広告はホーム最下部のみ。ATT はホーム表示後。拒否してもカウントは使える
- 保存ボタンはなく、すべて端末内に自動保存される

ログイン情報は不要（アカウントなし）。Sandbox の手順だけ書けば足りる。

## 10. ネイティブの再ビルド

このステップで変わったもの（アイコン、スプラッシュ、ATT文言、PrivacyInfo、AdMob App ID、`delayAppMeasurementInit`）は **JavaScript の OTA では届かない**。

```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
# 提出用
eas build --profile production --platform ios
```

development でホットリロード開発 → preview を TestFlight（内部）→ production を提出、の順が安全。

## 11. TestFlight

1. preview または production を内部テストに載せる
2. 実機で次を確認する
   - 起動、スプラッシュが緑系で Expo の青ではない
   - カウント・自動保存・0未満にならない
   - ATT がホームのあとで出る
   - 無料ならバナー（本番IDなら自分の広告をタップしない）
   - Sandbox で購入・復元・広告オフ
   - 設定の利用規約・プライバシーがアプリ内で開く
   - お問い合わせがメール、レビューが App Store に飛ぶ（ID設定後）
3. できれば実際の棚卸しで一度使ってもらう

## 12. スクリーンショット

`docs/app-store-listing.md` の計画どおり撮って、App Store Connect に載せる。

## 13. 提出

```bash
eas submit --platform ios --profile production
```

提出後、審査が返ってきたらメモとプライバシーラベルを見直す。JavaScript だけの修正は EAS Update（`channel: production`）で配れる。ネイティブ（権限、PrivacyInfo、広告App ID、アイコン）を触ったら再ビルドして再提出する。

## 公開直後

- AdMob の支払い・PIN
- PostHog で `app_open` が来ているか（入力内容が混ざっていないか）
- RevenueCat のダッシュボードで購入が `pro` になっているか
- クラッシュや起動失敗の問い合わせを設定のメールで受ける
