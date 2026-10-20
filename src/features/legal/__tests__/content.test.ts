import {
  LEGAL_OPERATOR_LOCATION,
  LEGAL_OPERATOR_NAME,
  LEGAL_SUPPORT_EMAIL,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  legalDocumentToMarkdown,
} from '../content';

declare function require(id: string): unknown;
declare const __dirname: string;

type NodeFs = { readFileSync: (path: string, encoding: 'utf8') => string };
type NodePath = { join: (...parts: string[]) => string };

function readRepoFile(relFromRoot: string): string {
  const { readFileSync } = require('fs') as NodeFs;
  const { join } = require('path') as NodePath;
  return readFileSync(join(__dirname, '../../../..', relFromRoot), 'utf8');
}

function readDoc(file: string): string {
  return readRepoFile(`docs/legal/${file}`);
}

function fullText(doc: typeof TERMS_OF_SERVICE): string {
  return `${doc.intro}\n${doc.sections.map((s) => s.body).join('\n')}`;
}

describe('法務ドキュメント', () => {
  it('利用規約とプライバシーに空の見出し・本文が無い', () => {
    for (const doc of [TERMS_OF_SERVICE, PRIVACY_POLICY]) {
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.intro.length).toBeGreaterThan(0);
      expect(doc.sections.length).toBeGreaterThan(3);
      for (const section of doc.sections) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      }
    }
  });

  it('入力内容を計測に載せないことをプライバシーに書く', () => {
    const text = PRIVACY_POLICY.sections.map((s) => s.body).join('\n');
    expect(text).toContain('項目名');
    expect(text).toContain('メモ');
    expect(text).toContain('送りません');
  });

  it('docs/legal の写しがアプリ内本文と完全一致する', () => {
    expect(readDoc('terms.md')).toBe(legalDocumentToMarkdown(TERMS_OF_SERVICE));
    expect(readDoc('privacy.md')).toBe(legalDocumentToMarkdown(PRIVACY_POLICY));
  });

  it('運営者情報のプレースホルダーが残っていない', () => {
    const terms = fullText(TERMS_OF_SERVICE);
    const privacy = fullText(PRIVACY_POLICY);
    for (const text of [terms, privacy, readDoc('terms.md'), readDoc('privacy.md')]) {
      expect(text).not.toMatch(/\{\{/);
      expect(text).not.toContain('運営者名');
      expect(text).not.toContain('連絡先メール');
    }
    expect(terms).toContain(LEGAL_OPERATOR_NAME);
    expect(terms).toContain(LEGAL_OPERATOR_LOCATION);
    expect(privacy).toContain(LEGAL_OPERATOR_NAME);
    expect(privacy).toContain(LEGAL_OPERATOR_LOCATION);
    expect(privacy).toContain(LEGAL_SUPPORT_EMAIL);
  });

  it('管轄は住所を書かず地方裁判所の専属的合意管轄とする', () => {
    const jurisdiction = TERMS_OF_SERVICE.sections.find((s) => s.heading.startsWith('9.'));
    expect(jurisdiction?.body).toContain('運営者の住所地を管轄する地方裁判所');
    expect(jurisdiction?.body).toContain('第一審の専属的合意管轄裁判所');
    expect(jurisdiction?.body).not.toContain('丁目');
    expect(jurisdiction?.body).not.toContain('番地');
  });

  it('.env.example にお問い合わせメールの例がある', () => {
    const envExample = readRepoFile('.env.example');
    expect(envExample).toContain('EXPO_PUBLIC_SUPPORT_EMAIL=');
    expect(envExample).toContain(LEGAL_SUPPORT_EMAIL);
  });
});
