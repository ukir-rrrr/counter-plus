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
  mkdirSync: (path: string, opts?: { recursive?: boolean }) => void;
  writeFileSync: (path: string, data: string, encoding: 'utf8') => void;
  readFileSync: (path: string, encoding: 'utf8') => string;
  existsSync: (path: string) => boolean;
  rmSync: (path: string, opts: { recursive: boolean; force: boolean }) => void;
};
type NodeOs = { tmpdir: () => string };
type NodePath = { join: (...parts: string[]) => string };

const { join } = require('path') as NodePath;
const {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} = require('fs') as NodeFs;
const { tmpdir } = require('os') as NodeOs;

const {
  LEGAL_SITE_DIR_NAME,
  assertSafeOutDir,
  buildLegalSite,
} = require(join(__dirname, '../../../../scripts/build-legal-site.js')) as {
  LEGAL_SITE_DIR_NAME: string;
  assertSafeOutDir: (outDir: string, rootDir: string) => string;
  buildLegalSite: (options?: {
    outDir?: string;
    rootDir?: string;
    docsDir?: string;
  }) => { outDir: string; files: string[] };
};

const docsDir = join(__dirname, '../../../../docs/legal');

describe('公開用の静的サイト', () => {
  let fakeRoot = '';
  let outDir = '';

  beforeAll(() => {
    fakeRoot = mkdtempSync(join(tmpdir(), 'legal-root-'));
    outDir = join(fakeRoot, LEGAL_SITE_DIR_NAME);
    buildLegalSite({ rootDir: fakeRoot, docsDir, outDir });
  });

  afterAll(() => {
    if (fakeRoot) rmSync(fakeRoot, { recursive: true, force: true });
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

describe('出力先の削除ガード', () => {
  it('legal-site とその配下だけを許可する', () => {
    const root = '/workspace';
    expect(assertSafeOutDir(join(root, 'legal-site'), root)).toBe(join(root, 'legal-site'));
    expect(assertSafeOutDir(join(root, 'legal-site', 'nested'), root)).toBe(
      join(root, 'legal-site', 'nested'),
    );
    expect(() => assertSafeOutDir(root, root)).toThrow(/legal-site/);
    expect(() => assertSafeOutDir(join(root, '.'), root)).toThrow(/legal-site/);
    expect(() => assertSafeOutDir(join(root, 'src'), root)).toThrow(/legal-site/);
    expect(() => assertSafeOutDir(join(root, 'legal-site-backup'), root)).toThrow(/legal-site/);
  });

  it('誤った出力先ではリポジトリ直下のファイルを消さない', () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'legal-guard-'));
    try {
      writeFileSync(join(fakeRoot, 'keep.txt'), '残す', 'utf8');
      mkdirSync(join(fakeRoot, 'src'));
      writeFileSync(join(fakeRoot, 'src', 'app.ts'), 'コード', 'utf8');

      expect(() => buildLegalSite({ rootDir: fakeRoot, docsDir, outDir: fakeRoot })).toThrow(
        /legal-site/,
      );
      expect(() =>
        buildLegalSite({ rootDir: fakeRoot, docsDir, outDir: join(fakeRoot, '.') }),
      ).toThrow(/legal-site/);
      expect(() =>
        buildLegalSite({ rootDir: fakeRoot, docsDir, outDir: join(fakeRoot, 'src') }),
      ).toThrow(/legal-site/);

      expect(readFileSync(join(fakeRoot, 'keep.txt'), 'utf8')).toBe('残す');
      expect(readFileSync(join(fakeRoot, 'src', 'app.ts'), 'utf8')).toBe('コード');
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});
