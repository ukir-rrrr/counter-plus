# RevenueCat / App Store Connect セットアップ

ステップ7の課金を本番で動かすために、オーナーがダッシュボード側で行う作業です。アプリのコードは Entitlement `pro` と商品ID `pro_lifetime` を前提にしています。

**公開APIキーはリポジトリに入れない。** `.env` と EAS の環境変数にだけ置き、`.env.example` は空のままにする。

## 必要なもの

- Apple Developer Program（有料）
- App Store Connect でこのアプリが作ってあること（Bundle ID: `com.chestnutukir.counterplus`）
- [RevenueCat](https://www.revenuecat.com/) のアカウント
- 実機またはシミュレータ用の **Development Build**（Expo Go では購入できない）

## 1. App Store Connect に買い切り商品を登録する

1. [App Store Connect](https://appstoreconnect.apple.com/) でアプリを開く
2. 「アプリ内課金」→「消費しない（Non-Consumable）」を追加する
3. 製品IDは **`pro_lifetime`** にする（コードと揃える。後から変えられない）
4. 表示名と説明を日本語で入れる（例：カウンター＋ Pro）
5. 価格を設定する（画面仕様の目安は ¥800。ストアの税込表示は国によって変わる）
6. 審査提出用のスクリーンショットが必要なら用意する
7. 「有料アプリケーション契約」と税務・口座情報が未完了なら先に済ませる。これがないとサンドボックスでも購入できないことがある

## 2. RevenueCat にプロジェクトと Entitlement を作る

1. RevenueCat でプロジェクトを作る
2. iOS アプリを追加し、Bundle ID を `com.chestnutukir.counterplus` にする
3. App Store Connect API キー（Issuer ID / Key ID / p8）を接続する。商品の取り込みとレシート検証に使う
4. **Entitlement** を作り、識別子を **`pro`** にする
5. Products に `pro_lifetime` を取り込み、Entitlement `pro` に紐づける
6. Offering（Current）を1つ作り、`pro_lifetime` を lifetime パッケージとして入れる
7. Project settings → API keys から **公開キー** を控える
   - iOS: `appl_` で始まるキー → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
   - Android を後で出すとき: `goog_` で始まるキー → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
8. 秘密鍵（Secret API key）はアプリに入れない

## 3. アプリへのキーの入れ方

ローカル（開発ビルド）:

1. リポジトリ直下に `.env` を作る（Git 管理外）
2. `.env.example` をコピーして、公開キーだけ入れる

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

EAS Build では [Environment variables](https://docs.expo.dev/eas/environment-variables/) に同じ名前で入れる。`eas.json` に実キーを書かない。

キーを変えたあとは Metro を再起動する。ネイティブモジュールを足したあと（今回の `react-native-purchases`）は **Development Build の作り直しが必要**。

```bash
npx expo start
# 実購入の確認は Expo Go ではなく development プロファイル
eas build --profile development --platform ios
```

## 4. Sandbox で購入・復元を確認する

1. App Store Connect → ユーザとアクセス → Sandbox → テスターを作る
2. 実機の設定 → App Store → Sandboxアカウントでそのテスターに入る（本番Apple IDとは分ける）
3. Development Build を入れて購入画面から買う
4. 確認すること
   - 価格がストアの表示用文字列になっている（コードに ¥800 を書いていない）
   - 購入後に「Proになりました」が出る
   - 設定の Pro 案内が消える
   - 履歴・CSV・2つ目のカテゴリ・自動並べ替えが使える
   - ホーム最下部の広告枠が消える
   - 「購入を復元」で同じテスターなら Pro に戻る
   - 未購入のテスターでは「復元できる購入がありません」
5. キャンセルはエラーにしない

## 5. Expo Go とテスト

`react-native-purchases` はネイティブモジュールなので、Expo Go や Jest では初期化しない。アプリは普通に動き、購入・復元を押すと「開発ビルドでのみ利用できます」と出す。クラッシュさせない。

## 6. よくある失敗

| 症状 | 確認すること |
| --- | --- |
| 商品が無い | Offering が Current か、商品IDが `pro_lifetime` か、有料アプリ契約が済んでいるか |
| 購入できない | Development Build か、Sandbox テスターか、Bundle ID が一致しているか |
| 復元できない | 同じ Sandbox アカウントか、Entitlement が `pro` か |
| キーエラー | `.env` の公開キーか、EAS の環境変数か（秘密鍵を入れていないか） |

Android は後回し。出すときは Play Console に同じ買い切りを登録し、RevenueCat に Android アプリと `goog_` キーを追加する。
