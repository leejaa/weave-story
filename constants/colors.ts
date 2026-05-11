export const palette = {
  light: {
    paper: '#efebef',
    paperSunk: '#e6e0e7',
    paperRaised: '#ffffff',
    ink: '#1f1b22',
    inkSoft: '#5e5862',
    inkFaint: '#968f9a',
    rule: '#dcd5dd',
    ruleStrong: '#c4bcc7',
    thread: '#8a7494',
    threadHover: '#9d869f',
    threadSoft: '#ddd4df',
    threadFaint: '#eee5ef',
    ember: '#b54b3c',
    emberSoft: '#f7e4e0',
    moss: '#5a7a4a',
    mossSoft: '#e5ede0',
    amber: '#b6862a',
    amberSoft: '#f3e8cd',
  },
  dark: {
    paper: '#1A171F',
    paperSunk: '#25212c',
    paperRaised: '#2e2935',
    ink: '#EAE4EA',
    inkSoft: '#a89ea8',
    inkFaint: '#3d3640',
    rule: '#241f2a',
    ruleStrong: '#322b38',
    thread: '#c8b8ce',
    threadHover: '#d8c8de',
    threadSoft: '#2a2530',
    threadFaint: '#1d1925',
    ember: '#d97768',
    emberSoft: '#3b201c',
    moss: '#9bbb89',
    mossSoft: '#243024',
    amber: '#e0b35a',
    amberSoft: '#3a2f15',
  },
} as const;

export type ThemeColors = {
  [K in keyof typeof palette.light]: string;
};

export const FONTS = {
  serif: 'Fraunces_400Regular',
  serifSemibold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const SIZES = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
  '5xl': 60,
} as const;
