import { useColorScheme } from 'react-native';

import { colors } from './theme';

/** className が使えない場所（SVGの色など）のためのトークン */
export function useThemeColors() {
  return colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
