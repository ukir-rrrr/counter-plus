import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../content';

declare function require(id: string): unknown;
declare const __dirname: string;

type NodeFs = { readFileSync: (path: string, encoding: 'utf8') => string };
type NodePath = { join: (...parts: string[]) => string };

function readDoc(file: string): string {
  const { readFileSync } = require('fs') as NodeFs;
  const { join } = require('path') as NodePath;
  return readFileSync(join(__dirname, '../../../../docs/legal', file), 'utf8');
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

  it('docs/legal の写しとアプリ内の見出しがずれない', () => {
    const termsMd = readDoc('terms.md');
    const privacyMd = readDoc('privacy.md');
    expect(termsMd).toContain('# 利用規約');
    expect(privacyMd).toContain('# プライバシーポリシー');
    for (const section of TERMS_OF_SERVICE.sections) {
      expect(termsMd).toContain(section.heading);
    }
    for (const section of PRIVACY_POLICY.sections) {
      expect(privacyMd).toContain(section.heading);
    }
  });
});
