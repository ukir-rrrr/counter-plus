# 広告・ATT・PostHog / App Store プライバシーのセットアップ

ステップ8を本番で動かすために、オーナーがダッシュボードと App Store Connect で行う作業です。**実キー・ユニットIDはリポジトリに入れない。** `.env` と EAS の環境変数にだけ置き、`.env.example` は空のままにする。

開発中のバナーは Google 公式のテスト広告IDを使います。本番IDで自分の広告をタップすると AdMob アカウント停止の恐れがあります。

## 必要なもの

- [Google AdMob](https://apps.admob.com/) のアカウント
- [PostHog](https://posthog.com/) のアカウント（Cloud でよい）
- Apple Developer Program と App Store Connect のアプリ（Bundle ID: `com.chestnutukir.counterplus`）
- **Development Build**（`react-native-google-mobile-ads` は Expo Go では動かない）

このステップで入れたネイティブモジュール（AdMob、ATT）を使うには、**Development Build の作り直し**が必要です。

```bash
eas build --profile development --platform ios
```

## 1. AdMob

1. AdMob でアプリを追加する（プラットフォーム iOS、Bundle ID を揃える）
2. **アプリID**（`ca-app-pub-xxxxxxxx~yyyyyyyyyy`）を控える
   - iOS → `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
   - Android を後で出すとき → `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
3. 広告ユニットを **バナー（アダプティブ）** で1つ作る
   - iOS → `EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID`
   - Android → `EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID`
4. 支払い・PIN など AdMob 側のアカウント確認を済ませる

アプリIDは **ビルド時** に Info.plist / AndroidManifest へ入ります。変えたらネイティブの再ビルドが必要です。バナーユニットIDは実行時に `.env` から読みます（開発中はテストIDを優先）。

ローカル:

```
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID=ca-app-pub-xxxxxxxx/zzzzzzzzzz
```

EAS Build では [Environment variables](https://docs.expo.dev/eas/environment-variables/) に同じ名前で入れる。`eas.json` の `environment` が development / preview / production に対応する。**production にはテストIDを置かない。** 本番プロファイルで Google サンプルの App ID（`3940256099942544`）が入っているとビルド設定が失敗する。バナーユニットIDも本番実行時はテストIDを使わない。

確認すること:

- 無料版のホーム最下部にだけバナーが出る（他の画面には出ない）
- ツールバー・＋−ボタンをバナーが覆わない
- Pro ではバナーが出ない
- ATT を拒否しても、非パーソナライズの広告は出せる（在庫が無いときは空になる）
- Expo Go ではバナーを出さず、アプリは普通に動く

## 2. ATT（App Tracking Transparency）

`NSUserTrackingUsageDescription` はアプリ設定に日本語で入っています。

文言: 「広告をあなたに合わせて表示するために、広告識別子を使います。許可しなくても、カウントや保存はそのまま使えます。」

ダイアログは **ホーム画面が見えてから** 出します（スプラッシュ中・初回描画の前には出さない）。iOS が一度回答を覚えるので、同じ端末では再表示しません。

実機の「設定 → プライバシーとセキュリティ → トラッキング」がオフだと、ダイアログは出ず拒否扱いです。

## 3. PostHog

1. PostHog でプロジェクトを作る
2. Project settings の **Project API Key**（`phc_` で始まる）を控える → `EXPO_PUBLIC_POSTHOG_API_KEY`
3. リージョンに合わせてホストを入れる（US Cloud なら `https://us.i.posthog.com`）→ `EXPO_PUBLIC_POSTHOG_HOST`
4. セッションリプレイは使わない。autocapture も使わない（項目名が混ざるため）
5. 匿名の distinct ID は端末内に残す（`persistence: 'file'`）。起動のたびに付け替えないので継続利用が測れる。メールや名前は載せない

送るイベント（入力内容は含まない）:

| イベント | 内容 |
| --- | --- |
| `app_open` | 起動 |
| `counter_created` / `category_created` | 項目・カテゴリを足した（名前は送らない） |
| `count_tapped` | カウント回数（まとめて送る。`count` のみ） |
| `pro_gate_shown` | Pro機能のゲートで購入画面が出た理由（`from`）。設定からの自主オープンは送らない |
| `purchase_completed` | 購入した（`from`） |
| `csv_exported` | CSV を共有した |

キーが無い・Expo Go では計測は no-op です。クラッシュしません。

## 4. App Store のプライバシーラベル

提出時の「アプリのプライバシー」で、少なくとも次を申告する（実際の設定に合わせて確認する）。

| データ | 用途 | ユーザーに紐づけるか | トラッキングに使うか |
| --- | --- | --- | --- |
| 広告データ（広告識別子） | サードパーティ広告 | 紐づけない | ATT 許可時のみトラッキング |
| 製品とのやり取り（機能の利用） | アナリティクス | 紐づけない | 使わない |

- トラッキング: AdMob のパーソナライズ広告（ATT 許可時）
- サードパーティ広告: Google AdMob
- アナリティクス: PostHog（イベント名と件数だけ。項目名・メモ・メールは送らない）
- アカウントは無いので、連絡先や名前は収集しない

プライバシーポリシーの URL も提出に必要です（`https://ukir-rrrr.github.io/counter-plus/privacy/`。手順は `docs/release-checklist.md`）。ATT を使うアプリは、トラッキングの申告とポリシーの記載が審査で見られます。

## 5. よくある失敗

| 症状 | 確認すること |
| --- | --- |
| バナーが出ない | Development Build か、テストIDか、Pro になっていないか、ユニットIDか |
| 起動時に落ちる | Expo Go ではなく development プロファイルか。キー無しでも落ちないのが正常 |
| ATT がすぐ出る | ホーム表示後に遅れて出ること。スプラッシュ中なら実装が古い |
| 自分の広告をタップしてしまった | 本番IDを開発で使っていないか。テストIDに戻す |
| PostHog にイベントが無い | `.env` の `EXPO_PUBLIC_POSTHOG_API_KEY` か、Metro 再起動か |

Android は後回し。出すときは AdMob に Android アプリとバナーを追加し、同じ環境変数を入れる。
