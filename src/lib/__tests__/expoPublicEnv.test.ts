declare function require(id: string): unknown;
declare const __dirname: string;

type NodeFs = { readFileSync: (path: string, encoding: 'utf8') => string };
type NodePath = { join: (...parts: string[]) => string };

function readSource(relFromRoot: string): string {
  const { readFileSync } = require('fs') as NodeFs;
  const { join } = require('path') as NodePath;
  return readFileSync(join(__dirname, '../../..', relFromRoot), 'utf8');
}

function readLibSource(file: string): string {
  return readSource(`src/lib/${file}`);
}

const SOURCE_FILES = [
  'src/lib/ads.tsx',
  'src/lib/analytics.ts',
  'src/lib/purchases.ts',
  'src/features/settings/actions.ts',
] as const;

describe('EXPO_PUBLIC_ の読み方', () => {
  it('process.env.EXPO_PUBLIC_NAME を直接参照し、env.EXPO_PUBLIC_ の間接参照を使わない', () => {
    for (const file of SOURCE_FILES) {
      const src = readSource(file);
      expect(src).toMatch(/process\.env\.EXPO_PUBLIC_[A-Z0-9_]+/);
      expect(src).not.toMatch(/(?<!process\.)env\.EXPO_PUBLIC_/);
      expect(src).not.toMatch(/=\s*process\.env\s*[,)]/);
    }
  });

  it('PostHog の匿名IDはファイルに残す', () => {
    const src = readLibSource('analytics.ts');
    expect(src).toMatch(/persistence:\s*'file'/);
    expect(src).not.toMatch(/persistence:\s*'memory'/);
  });

  it('広告の Pro 判定は getIsPro() 経由にする', () => {
    const src = readLibSource('ads.tsx');
    expect(src).toMatch(/getIsPro\(/);
    expect(src).not.toMatch(/usePurchasesStore\.getState/);
  });

  it('バナーのテストユニットIDは __DEV__ の内側だけに書く', () => {
    const src = readLibSource('ads.tsx');
    expect(src).toMatch(/if \(__DEV__\) \{[\s\S]*2435281174/);
    expect(src).toMatch(/if \(isGoogleSampleAdId\(id\)\) return null/);
  });
});
