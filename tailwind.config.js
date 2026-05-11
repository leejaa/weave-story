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
      colors: {
        paper: {
          DEFAULT: '#efebef',
          sunk: '#e6e0e7',
          raised: '#ffffff',
        },
        ink: {
          DEFAULT: '#1f1b22',
          soft: '#5e5862',
          faint: '#968f9a',
        },
        rule: {
          DEFAULT: '#dcd5dd',
          strong: '#c4bcc7',
        },
        thread: {
          DEFAULT: '#8a7494',
          hover: '#9d869f',
          soft: '#ddd4df',
          faint: '#eee5ef',
        },
        ember: {
          DEFAULT: '#b54b3c',
          soft: '#f7e4e0',
        },
        moss: {
          DEFAULT: '#5a7a4a',
          soft: '#e5ede0',
        },
        'story-amber': {
          DEFAULT: '#b6862a',
          soft: '#f3e8cd',
        },
      },
      fontFamily: {
        serif: ['Fraunces_400Regular'],
        'serif-semibold': ['Fraunces_600SemiBold'],
        'serif-italic': ['Fraunces_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        mono: ['JetBrainsMono_400Regular'],
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
