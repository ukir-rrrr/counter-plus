// デザイントークン（docs/design/screens.md）。className が使えない場所（ナビゲーションのテーマ、アイコンの色など）で使う
// 値を変えるときは tailwind.config.js と src/global.css も直す

const light = {
  background: '#F4F5F2',
  surface: '#FFFFFF',
  border: '#E3E6E1',
  divider: '#ECEEEA',
  ink: '#1B1F1D',
  inkMuted: '#59615D',
  inkSubtle: '#646C68',
  accent: '#0F6E5C',
  onAccent: '#FFFFFF',
  accentSoft: '#E3F1EC',
  accentInk: '#0A4F42',
  neutralButton: '#EEF0EC',
  danger: '#B42318',
  dangerBg: '#FFF6F5',
  dangerBorder: '#F1C9C4',
  adBg: '#E4E7E2',
};

const dark: typeof light = {
  background: '#121513',
  surface: '#1C201E',
  border: '#2C322F',
  divider: '#252A27',
  ink: '#ECEFEC',
  inkMuted: '#A9B1AC',
  inkSubtle: '#8F9893',
  accent: '#45B497',
  onAccent: '#0B1F1A',
  accentSoft: '#173A31',
  accentInk: '#9FDCC9',
  neutralButton: '#2A302D',
  danger: '#F2867B',
  dangerBg: '#2A1716',
  dangerBorder: '#5A2A26',
  adBg: '#1F2421',
};

export const colors = { light, dark };

export type ColorScheme = keyof typeof colors;

/** 項目の色。DB（counters.color）にはキーを保存する */
export const itemColors = {
  blue: '#3E7CB1',
  green: '#3F9A6E',
  orange: '#C9772E',
  purple: '#9A5BB0',
  red: '#C2414B',
  gray: '#6B726E',
} as const;

export type ItemColor = keyof typeof itemColors;

export const fonts = {
  sans: 'IBMPlexSansJP_400Regular',
  sansMedium: 'IBMPlexSansJP_500Medium',
  sansBold: 'IBMPlexSansJP_700Bold',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemibold: 'IBMPlexMono_600SemiBold',
} as const;

export const fontSize = {
  title: 17,
  total: 34,
  count: 22,
  countLg: 44,
  body: 15,
  bodySm: 14,
  label: 12,
  hint: 11,
} as const;

export const radius = {
  card: 16,
  control: 12,
  sheet: 22,
} as const;

export const spacing = {
  screen: 16,
} as const;

/** タッチ領域の最小サイズ（pt） */
export const minTouchSize = 44;
