/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ⚠️ Source of truth 는 constants/colors.ts (palette.light / FONTS) 입니다.
      // 이 앱은 StyleSheet + 상수로 스타일링하며 NativeWind className 은 쓰지 않지만,
      // 추후 사용 시 올바른 값이 나오도록 아래를 constants 와 동기화 상태로 유지하세요.
      colors: {
        paper: {
          DEFAULT: '#f5f0e8',
          sunk: '#ede7db',
          raised: '#faf7f2',
        },
        ink: {
          DEFAULT: '#1c1c17',
          soft: '#4c4c3e',
          faint: '#8c8c78',
        },
        rule: {
          DEFAULT: '#ddd7cb',
          strong: '#c4bcae',
        },
        thread: {
          DEFAULT: '#2d5a3d',
          hover: '#3a7050',
          soft: '#c2d9c9',
          faint: '#e2ede5',
        },
        ember: {
          DEFAULT: '#b54b3c',
          soft: '#f7e4e0',
        },
        moss: {
          DEFAULT: '#7a6a3c',
          soft: '#ede5cd',
        },
        amber: {
          DEFAULT: '#b6862a',
          soft: '#f3e8cd',
        },
      },
      fontFamily: {
        // FONTS (constants/colors.ts) 와 1:1
        serif: ['Fraunces_400Regular'],
        'serif-semibold': ['Fraunces_600SemiBold'],
        'serif-italic': ['Fraunces_400Regular_Italic'],
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        mono: ['DMMono_400Regular'],
        display: ['BlackHanSans_400Regular'],
        cover: ['Jua_400Regular'],
      },
      borderRadius: {
        xs: 4,
        sm: 6,
        md: 10,
        lg: 16,
        xl: 24,
        pill: 999,
      },
    },
  },
  plugins: [],
};
