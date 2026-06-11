import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en_common from '@/locales/en/common.json';
import en_home from '@/locales/en/home.json';
import en_library from '@/locales/en/library.json';
import en_weave from '@/locales/en/weave.json';
import en_reading from '@/locales/en/reading.json';
import en_you from '@/locales/en/you.json';
import en_purchases from '@/locales/en/purchases.json';

import ko_common from '@/locales/ko/common.json';
import ko_home from '@/locales/ko/home.json';
import ko_library from '@/locales/ko/library.json';
import ko_weave from '@/locales/ko/weave.json';
import ko_reading from '@/locales/ko/reading.json';
import ko_you from '@/locales/ko/you.json';
import ko_purchases from '@/locales/ko/purchases.json';

import ja_common from '@/locales/ja/common.json';
import ja_home from '@/locales/ja/home.json';
import ja_library from '@/locales/ja/library.json';
import ja_weave from '@/locales/ja/weave.json';
import ja_reading from '@/locales/ja/reading.json';
import ja_you from '@/locales/ja/you.json';
import ja_purchases from '@/locales/ja/purchases.json';

import zhHant_common from '@/locales/zh-Hant/common.json';
import zhHant_home from '@/locales/zh-Hant/home.json';
import zhHant_library from '@/locales/zh-Hant/library.json';
import zhHant_weave from '@/locales/zh-Hant/weave.json';
import zhHant_reading from '@/locales/zh-Hant/reading.json';
import zhHant_you from '@/locales/zh-Hant/you.json';
import zhHant_purchases from '@/locales/zh-Hant/purchases.json';

export const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'zh-Hant'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-Hant': '繁體中文',
};

function detectLocale(): SupportedLocale {
  const loc = Localization.getLocales()[0];
  const code = loc?.languageCode ?? 'en';
  // Chinese: only Traditional is supported. A Traditional-Chinese device reports
  // languageCode 'zh', so disambiguate by script (Hant) or region (TW/HK/MO).
  // Simplified Chinese is not supported and falls back to English.
  if (code === 'zh') {
    const tag = loc?.languageTag ?? ''; // e.g. 'zh-Hant-TW', 'zh-TW', 'zh-HK'
    const region = loc?.regionCode ?? '';
    const isTraditional = /hant/i.test(tag) || ['TW', 'HK', 'MO'].includes(region);
    return isTraditional ? 'zh-Hant' : 'en';
  }
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
    ? (code as SupportedLocale)
    : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: en_common,
      home: en_home,
      library: en_library,
      weave: en_weave,
      reading: en_reading,
      you: en_you,
      purchases: en_purchases,
    },
    ko: {
      common: ko_common,
      home: ko_home,
      library: ko_library,
      weave: ko_weave,
      reading: ko_reading,
      you: ko_you,
      purchases: ko_purchases,
    },
    ja: {
      common: ja_common,
      home: ja_home,
      library: ja_library,
      weave: ja_weave,
      reading: ja_reading,
      you: ja_you,
      purchases: ja_purchases,
    },
    'zh-Hant': {
      common: zhHant_common,
      home: zhHant_home,
      library: zhHant_library,
      weave: zhHant_weave,
      reading: zhHant_reading,
      you: zhHant_you,
      purchases: zhHant_purchases,
    },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

/** The locale a newly created story should be generated in. The server re-validates. */
export function storyLanguage(): SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLocale)
    : 'en';
}

export default i18n;
