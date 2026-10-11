// デザイントークン（docs/design/screens.md）。値を変えるときは src/constants/theme.ts と src/global.css も直す
const tokenColors = [
  'background',
  'surface',
  'border',
  'divider',
  'ink',
  'ink-muted',
  'ink-subtle',
  'accent',
  'on-accent',
  'accent-soft',
  'accent-ink',
  'neutral-button',
  'danger',
  'danger-bg',
  'danger-border',
  'ad-bg',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ライト・ダークの値は src/global.css の CSS 変数で切り替える
        ...Object.fromEntries(tokenColors.map((name) => [name, `var(--color-${name})`])),
        item: {
          blue: '#3E7CB1',
          green: '#3F9A6E',
          orange: '#C9772E',
          purple: '#9A5BB0',
          red: '#C2414B',
          gray: '#6B726E',
        },
      },
      fontFamily: {
        sans: ['IBMPlexSansJP_400Regular'],
        'sans-medium': ['IBMPlexSansJP_500Medium'],
        'sans-bold': ['IBMPlexSansJP_700Bold'],
        'mono-medium': ['IBMPlexMono_500Medium'],
        'mono-semibold': ['IBMPlexMono_600SemiBold'],
      },
      fontSize: {
        title: '17px',
        total: '34px',
        'total-sm': '30px',
        count: '22px',
        'count-sm': '18px',
        'count-lg': '44px',
        body: '15px',
        'body-sm': '14px',
        label: '12px',
        hint: '11px',
      },
      borderRadius: {
        card: '16px',
        control: '12px',
        sheet: '22px',
      },
      spacing: {
        screen: '16px',
      },
    },
  },
  plugins: [],
};
