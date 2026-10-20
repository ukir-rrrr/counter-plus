#!/usr/bin/env node
/**
 * docs/legal の Markdown から、GitHub Pages 向けの静的 HTML を出す。
 * 依存パッケージは使わない（Node 標準ライブラリのみ）。
 */

const fs = require('fs');
const path = require('path');

const publisher = require('../src/features/legal/publisher.json');

const LEGAL_SITE_DIR_NAME = 'legal-site';
const DEFAULT_ORIGIN = publisher.publicSiteOrigin;
const DEFAULT_EMAIL = publisher.supportEmail;
const DEFAULT_OPERATOR = publisher.operatorName;
const DEFAULT_LOCATION = publisher.operatorLocation;

const PAGES = [
  {
    id: 'home',
    file: 'index.html',
    title: 'カウンター＋',
    description: 'カウンター＋の利用規約とプライバシーポリシーです。',
    canonicalPath: '/',
    nav: 'home',
  },
  {
    id: 'terms',
    source: 'terms.md',
    dir: 'terms',
    file: 'terms/index.html',
    title: '利用規約 | カウンター＋',
    description: 'カウンター＋の利用規約です。',
    canonicalPath: '/terms/',
    nav: 'terms',
  },
  {
    id: 'privacy',
    source: 'privacy.md',
    dir: 'privacy',
    file: 'privacy/index.html',
    title: 'プライバシーポリシー | カウンター＋',
    description: 'カウンター＋のプライバシーポリシーです。',
    canonicalPath: '/privacy/',
    nav: 'privacy',
  },
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkifySupportEmail(escapedText, email) {
  const escapedEmail = escapeHtml(email);
  const mailto = `mailto:${encodeURIComponent(email)}`;
  return escapedText.split(escapedEmail).join(`<a href="${mailto}">${escapedEmail}</a>`);
}

function markdownToInnerHtml(markdown, email) {
  const blocks = markdown.trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const line = block.trim();
      if (line.startsWith('## ')) {
        return `<h2>${linkifySupportEmail(escapeHtml(line.slice(3)), email)}</h2>`;
      }
      if (line.startsWith('# ')) {
        return `<h1>${linkifySupportEmail(escapeHtml(line.slice(2)), email)}</h1>`;
      }
      return `<p>${linkifySupportEmail(escapeHtml(line), email)}</p>`;
    })
    .join('\n');
}

function navHref(from, to) {
  if (from === to) return null;
  if (from === 'home') {
    if (to === 'terms') return 'terms/';
    if (to === 'privacy') return 'privacy/';
    return './';
  }
  if (to === 'home') return '../';
  if (to === 'terms') return '../terms/';
  return '../privacy/';
}

function renderNav(current) {
  const items = [
    { id: 'home', label: 'トップ' },
    { id: 'terms', label: '利用規約' },
    { id: 'privacy', label: 'プライバシーポリシー' },
  ];
  const links = items
    .map((item) => {
      const href = navHref(current, item.id);
      if (!href) {
        return `<span aria-current="page">${escapeHtml(item.label)}</span>`;
      }
      return `<a href="${href}">${escapeHtml(item.label)}</a>`;
    })
    .join('');
  return `<nav aria-label="ページ">${links}</nav>`;
}

function siteCss() {
  // 色は docs/design/screens.md のトークン（ライト／ダーク）
  return `:root {
  --background: #f4f5f2;
  --surface: #ffffff;
  --border: #e3e6e1;
  --ink: #1b1f1d;
  --ink-muted: #59615d;
  --ink-subtle: #646c68;
  --accent: #0f6e5c;
  --accent-soft: #e3f1ec;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #121513;
    --surface: #1c201e;
    --border: #2c322f;
    --ink: #ecefec;
    --ink-muted: #a9b1ac;
    --ink-subtle: #8f9893;
    --accent: #45b497;
    --accent-soft: #173a31;
  }
}
* { box-sizing: border-box; }
html { font-size: 16px; }
body {
  margin: 0;
  background: var(--background);
  color: var(--ink);
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  line-height: 1.75;
}
a { color: var(--accent); }
header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.wrap {
  max-width: 40rem;
  margin: 0 auto;
  padding: 16px;
}
.brand {
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  text-decoration: none;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
nav a, nav span {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
}
nav a {
  background: var(--accent-soft);
  color: var(--accent);
}
nav span[aria-current="page"] {
  background: var(--accent);
  color: #ffffff;
}
@media (prefers-color-scheme: dark) {
  nav span[aria-current="page"] { color: #0b1f1a; }
}
main { padding-bottom: 48px; }
h1 { font-size: 1.5rem; line-height: 1.4; margin: 0 0 8px; }
h2 { font-size: 1.05rem; margin: 28px 0 8px; }
p { margin: 0 0 16px; color: var(--ink); }
.lead, main p:nth-of-type(1) { color: var(--ink-muted); }
.cards {
  display: grid;
  gap: 12px;
  margin: 24px 0;
}
.card {
  display: block;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  min-height: 44px;
  text-decoration: none;
  color: var(--ink);
}
.card strong { display: block; color: var(--accent); margin-bottom: 4px; }
.meta { color: var(--ink-subtle); font-size: 14px; }
footer {
  border-top: 1px solid var(--border);
  color: var(--ink-subtle);
  font-size: 13px;
}
footer p { color: var(--ink-subtle); margin: 0 0 8px; }`;
}

function renderPage({ title, description, canonical, nav, body, operator, location, email }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <style>${siteCss()}</style>
</head>
<body>
  <header>
    <div class="wrap">
      <a class="brand" href="${nav === 'home' ? './' : '../'}">カウンター＋</a>
      ${renderNav(nav)}
    </div>
  </header>
  <main class="wrap">
    ${body}
  </main>
  <footer>
    <div class="wrap">
      <p>運営：${escapeHtml(operator)}（所在地：${escapeHtml(location)}）</p>
      <p>お問い合わせ：${linkifySupportEmail(escapeHtml(email), email)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

function homeBody(email) {
  return `<h1>カウンター＋</h1>
<p class="lead">開けばすぐ数えられて、勝手に保存され、終わったらCSVで送れるカウンターです。</p>
<div class="cards">
  <a class="card" href="privacy/"><strong>プライバシーポリシー</strong><span class="meta">情報の取り扱い</span></a>
  <a class="card" href="terms/"><strong>利用規約</strong><span class="meta">利用条件</span></a>
</div>
<p>お問い合わせは ${linkifySupportEmail(escapeHtml(email), email)} までご連絡ください。</p>`;
}

function repoRootDir() {
  return path.join(__dirname, '..');
}

/**
 * 消してよいのは rootDir/legal-site とその配下だけ。
 * `.` や src を渡してリポジトリごと消さないためのガード。
 */
function assertSafeOutDir(outDir, rootDir) {
  const resolvedOut = path.resolve(outDir);
  const allowedRoot = path.resolve(rootDir, LEGAL_SITE_DIR_NAME);
  const relative = path.relative(allowedRoot, resolvedOut);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `出力先は ${LEGAL_SITE_DIR_NAME}/ 以下だけです（受け取った値: ${outDir}）`,
    );
  }
  return resolvedOut;
}

function resolveDirs(options = {}) {
  const root = options.rootDir ?? repoRootDir();
  const requestedOut = options.outDir ?? path.join(root, LEGAL_SITE_DIR_NAME);
  return {
    docsDir: options.docsDir ?? path.join(root, 'docs', 'legal'),
    outDir: assertSafeOutDir(requestedOut, root),
    origin: (options.origin ?? DEFAULT_ORIGIN).replace(/\/$/, ''),
    email: options.email ?? DEFAULT_EMAIL,
    operator: options.operator ?? DEFAULT_OPERATOR,
    location: options.location ?? DEFAULT_LOCATION,
  };
}

function buildLegalSite(options = {}) {
  const { docsDir, outDir, origin, email, operator, location } = resolveDirs(options);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const page of PAGES) {
    let body;
    if (page.source) {
      const markdown = fs.readFileSync(path.join(docsDir, page.source), 'utf8');
      body = markdownToInnerHtml(markdown, email);
    } else {
      body = homeBody(email);
    }
    const html = renderPage({
      title: page.title,
      description: page.description,
      canonical: `${origin}${page.canonicalPath}`,
      nav: page.nav,
      body,
      operator,
      location,
      email,
    });
    const dest = path.join(outDir, page.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html, 'utf8');
  }

  return { outDir, files: PAGES.map((page) => page.file) };
}

if (require.main === module) {
  const outDir = process.argv[2];
  const result = buildLegalSite(outDir ? { outDir: path.resolve(outDir) } : {});
  process.stdout.write(`legal site -> ${result.outDir}\n`);
}

module.exports = {
  DEFAULT_ORIGIN,
  DEFAULT_EMAIL,
  LEGAL_SITE_DIR_NAME,
  assertSafeOutDir,
  buildLegalSite,
  markdownToInnerHtml,
  escapeHtml,
};
