import {
  LEGAL_OPERATOR_LOCATION,
  LEGAL_OPERATOR_NAME,
  LEGAL_PUBLIC_SITE_ORIGIN,
  LEGAL_SUPPORT_EMAIL,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from '../content';

declare function require(id: string): unknown;
declare const __dirname: string;

type NodeFs = {
  mkdtempSync: (prefix: string) => string;
  readFileSync: (path: string, encoding: 'utf8') => string;
  existsSync: (path: string) => boolean;
  rmSync: (path: string, opts: { recursive: boolean; force: boolean }) => void;
};
type NodeOs = { tmpdir: () => string };
type NodePath = { join: (...parts: string[]) => string };

const { join } = require('path') as NodePath;
const { mkdtempSync, readFileSync, existsSync, rmSync } = require('fs') as NodeFs;
const { tmpdir } = require('os') as NodeOs;

const { buildLegalSite } = require(join(__dirname, '../../../../scripts/build-legal-site.js')) as {
  buildLegalSite: (options?: { outDir?: string }) => { outDir: string; files: string[] };
};

describe('公開用の静的サイト', () => {
  let outDir = '';

  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'legal-site-'));
    buildLegalSite({ outDir });
  });

  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  function readPage(rel: string): string {
    return readFileSync(join(outDir, rel), 'utf8');
  }

  it('トップ・規約・プライバシーの3ページを出す', () => {
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'terms/index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'privacy/index.html'))).toBe(true);
  });

  it('HTML は日本語・スマホ向けで、本文がアプリ内と食い違わない', () => {
    const privacy = readPage('privacy/index.html');
    const terms = readPage('terms/index.html');
    const home = readPage('index.html');

    expect(privacy).toContain('lang="ja"');
    expect(privacy).toContain('width=device-width');
    expect(privacy).toContain(PRIVACY_POLICY.intro);
    expect(privacy).toContain(LEGAL_SUPPORT_EMAIL);
    expect(privacy).toContain(`mailto:${encodeURIComponent(LEGAL_SUPPORT_EMAIL)}`);
    expect(privacy).toContain(`${LEGAL_PUBLIC_SITE_ORIGIN}/privacy/`);

    expect(terms).toContain(TERMS_OF_SERVICE.intro);
    expect(terms).toContain('運営者の住所地を管轄する地方裁判所');
    expect(terms).toContain(`${LEGAL_PUBLIC_SITE_ORIGIN}/terms/`);

    expect(home).toContain('プライバシーポリシー');
    expect(home).toContain('利用規約');
    expect(home).toContain('href="privacy/"');
    expect(home).toContain('href="terms/"');
    expect(home).toContain(LEGAL_OPERATOR_NAME);
    expect(home).toContain(LEGAL_OPERATOR_LOCATION);

    for (const html of [privacy, terms, home]) {
      expect(html).not.toMatch(/\{\{/);
      expect(html).toContain(`運営：${LEGAL_OPERATOR_NAME}`);
    }
  });
});
