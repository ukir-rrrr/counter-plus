/// <reference types="nativewind/types" />

// CSS のサイドエフェクトインポートの型定義（NativeWind で使用）
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
