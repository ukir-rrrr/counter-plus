/** 利用規約・プライバシーポリシーの本文。画面と docs/legal の写しで同じ構成にする */

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  id: 'terms' | 'privacy';
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
};

/** 公開ページ（GitHub Pages）。App Store Connect の URL にも使う */
export const LEGAL_PUBLIC_SITE_ORIGIN = 'https://ukir-rrrr.github.io/counter-plus';

export const LEGAL_OPERATOR_NAME = 'chestnut';
export const LEGAL_OPERATOR_LOCATION = '日本';
export const LEGAL_SUPPORT_EMAIL = 'aba929559@gmail.com';

export const LEGAL_UPDATED_LABEL = '最終更新：2026年10月20日';

export const TERMS_OF_SERVICE: LegalDocument = {
  id: 'terms',
  title: '利用規約',
  updatedLabel: LEGAL_UPDATED_LABEL,
  intro: `この利用規約（以下「本規約」）は、${LEGAL_OPERATOR_NAME}（所在地：${LEGAL_OPERATOR_LOCATION}。以下「提供者」）が提供するアプリ「カウンター＋」（以下「本アプリ」）の利用条件を定めるものです。本アプリをダウンロードし、または利用した時点で、本規約に同意したものとみなします。`,
  sections: [
    {
      heading: '1. サービス内容',
      body: '本アプリは、在庫の棚卸しや回数の記録など、項目ごとのカウントを端末内で行い、必要に応じてCSVで書き出すためのツールです。サーバー上のアカウントはなく、カウントデータは原則としてお使いの端末に保存されます。',
    },
    {
      heading: '2. 無料版とPro',
      body: '本アプリは無料で利用できます。無料版では画面下部にバナー広告を表示します。有料の買い切り（カウンター＋ Pro）を購入すると、広告の非表示、カテゴリの追加、履歴の表示、CSV出力、自動並べ替えなどが使えます。価格はApp Storeに表示される金額です。サブスクリプションではありません。',
    },
    {
      heading: '3. 購入と復元',
      body: 'Proの購入・支払い・領収書はAppleの決済を通じて行われます。購入の取り消しや返金は、Appleの利用規約とサポートの手続きに従います。機種変更後は、同じApple IDで「購入を復元」を行ってください。本アプリの提供者が、App Store外で直接課金することはありません。',
    },
    {
      heading: '4. データの扱い',
      body: 'カウント結果・項目名・メモなどは端末内に保存されます。端末の故障、アプリの削除、OSの初期化などによりデータが失われることがあります。重要な結果はCSVで書き出して保管してください。本アプリはクラウド同期やバックアップサービスを提供しません。',
    },
    {
      heading: '5. 禁止事項',
      body: '法令に違反する利用、本アプリや第三者の権利を侵害する利用、不正な手段による購入や広告の操作、本アプリの改変・リバースエンジニアリング、過度な負荷を与える行為を禁じます。',
    },
    {
      heading: '6. 免責',
      body: '本アプリは現状有姿で提供します。カウント結果の正確性、特定の目的への適合、中断のない稼働を保証しません。棚卸しや業務上の判断は利用者の責任で行ってください。本アプリの利用または利用不能から生じた損害について、法令で認められる範囲で提供者は責任を負いません。',
    },
    {
      heading: '7. 知的財産',
      body: '本アプリおよびそのデザイン・文章・ソフトウェアに関する権利は、提供者または正当な権利者に帰属します。利用者が本アプリに入力した項目名やメモの権利は、利用者に留まります。',
    },
    {
      heading: '8. 変更と終了',
      body: '提供者は、本規約や機能を変更し、または本アプリの提供を終了することがあります。重要な変更は、本アプリ内の表示やバージョン情報の更新によりお知らせします。変更後に利用を続けた場合は、変更に同意したものとみなします。',
    },
    {
      heading: '9. 準拠法',
      body: '本規約は日本法に準拠します。本アプリに関して紛争が生じた場合は、運営者の住所地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。',
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy',
  title: 'プライバシーポリシー',
  updatedLabel: LEGAL_UPDATED_LABEL,
  intro: `カウンター＋（以下「本アプリ」）の提供者（${LEGAL_OPERATOR_NAME}、所在地：${LEGAL_OPERATOR_LOCATION}。以下「提供者」）は、本アプリにおける情報の取り扱いを次のとおり定めます。本アプリはアカウント登録を行わず、カウントの中身をサーバーへ送りません。`,
  sections: [
    {
      heading: '1. 端末内に保存する情報',
      body: 'カテゴリ名、項目名、メモ、カウント数、操作の履歴、振動や画面点灯などの設定は、お使いの端末内のデータベース（SQLite）に保存します。これらの入力内容は、計測や広告の送信対象にしません。端末の外へ自動でバックアップすることはありません。',
    },
    {
      heading: '2. 広告（Google AdMob）',
      body: '無料版では、ホーム画面の最下部にバナー広告を表示します。広告の配信には Google AdMob を使います。パーソナライズ広告のため、初回利用時にトラッキングの許可（ATT）を求めます。許可した場合、広告識別子（IDFA）が広告の配信・効果測定に使われることがあります。許可しなくても、カウントや保存はそのまま使え、非パーソナライズの広告が表示されることがあります。Proを購入すると広告は表示しません。',
    },
    {
      heading: '3. 計測（PostHog）',
      body: 'どの機能が使われたかを把握するため、匿名の計測イベントを PostHog に送ります。送るのは起動、項目やカテゴリを追加したこと、カウント操作の回数、購入画面を開いた理由、購入完了、CSV出力など、あらかじめ決めたイベント名と件数だけです。項目名、メモ、メールアドレス、氏名は送りません。個人を特定するプロフィールは作りません。',
    },
    {
      heading: '4. 購入（Apple / RevenueCat）',
      body: 'Proの購入状態の確認と復元のため、Apple の課金基盤と RevenueCat を使います。レシートの検証に必要な情報が第三者（Apple および RevenueCat）に渡ります。提供者はクレジットカード番号を受け取りません。',
    },
    {
      heading: '5. 第三者提供と国外移転',
      body: '広告・計測・購入の処理のため、Google、PostHog、RevenueCat、Apple がそれぞれの国・地域で情報を取り扱うことがあります。法令に基づく場合を除き、入力したカウント内容を第三者に販売しません。',
    },
    {
      heading: '6. 保管期間',
      body: '端末内のデータは、利用者がアプリを削除するか、端末上で消去するまで残ります。計測の匿名イベントは、各サービスの保持設定に従います。購入記録は、Apple および法令上必要な期間、決済側で保持されます。',
    },
    {
      heading: '7. お子さまの利用',
      body: '本アプリは、特定の年齢層に向けたものではありません。13歳未満の方を対象としたサービスではなく、お子さまの個人情報を故意に収集しません。',
    },
    {
      heading: '8. お問い合わせ',
      body: `本ポリシーや個人情報の取り扱いについてのお問い合わせは、本アプリの設定画面「お問い合わせ」または ${LEGAL_SUPPORT_EMAIL} までご連絡ください。設定のメールが未設定の場合は、公開している本ポリシーのページに記載の連絡先をご利用ください。`,
    },
    {
      heading: '9. 変更',
      body: '本ポリシーの内容は、法令やサービスの変更に合わせて改定することがあります。改定後の内容は、本アプリ内の本画面に掲載した時点から効力を生じます。',
    },
  ],
};

export function legalRoute(id: LegalDocument['id']): '/legal/terms' | '/legal/privacy' {
  return id === 'terms' ? '/legal/terms' : '/legal/privacy';
}

/** docs/legal の写しと同じ並びの Markdown。公開ページの原稿にも使う */
export function legalDocumentToMarkdown(doc: LegalDocument): string {
  const parts = [`# ${doc.title}`, '', doc.updatedLabel, '', doc.intro, ''];
  for (const section of doc.sections) {
    parts.push(`## ${section.heading}`, '', section.body, '');
  }
  return `${parts.join('\n').trimEnd()}\n`;
}
