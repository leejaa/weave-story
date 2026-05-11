import { useColorScheme } from 'react-native';
import { palette, ThemeColors } from '@/constants/colors';

export function usePalette(): ThemeColors {
  const scheme = useColorScheme();
  return palette[scheme === 'dark' ? 'dark' : 'light'];
}
