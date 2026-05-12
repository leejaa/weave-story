export const palette = {
  light: {
    paper: '#f5f0e8',
    paperSunk: '#ede7db',
    paperRaised: '#faf7f2',
    ink: '#1c1c17',
    inkSoft: '#4c4c3e',
    inkFaint: '#8c8c78',
    rule: '#ddd7cb',
    ruleStrong: '#c4bcae',
    thread: '#2d5a3d',
    threadHover: '#3a7050',
    threadSoft: '#c2d9c9',
    threadFaint: '#e2ede5',
    ember: '#b54b3c',
    emberSoft: '#f7e4e0',
    moss: '#7a6a3c',
    mossSoft: '#ede5cd',
    amber: '#b6862a',
    amberSoft: '#f3e8cd',
  },
  dark: {
    paper: '#131710',
    paperSunk: '#1b2018',
    paperRaised: '#232b1f',
    ink: '#e8e6de',
    inkSoft: '#a8a894',
    inkFaint: '#383830',
    rule: '#20261c',
    ruleStrong: '#2c3428',
    thread: '#6db87e',
    threadHover: '#82ca92',
    threadSoft: '#192c1e',
    threadFaint: '#141c15',
    ember: '#d97768',
    emberSoft: '#3b201c',
    moss: '#c8b870',
    mossSoft: '#2a2810',
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
