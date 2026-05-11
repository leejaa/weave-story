import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { SUPPORTED_LOCALES, LOCALE_LABELS, SupportedLocale } from '@/lib/i18n';

const STORAGE_KEY = 'user_locale';

export async function loadSavedLocale(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) {
    await i18n.changeLanguage(saved as SupportedLocale);
  }
}

export function useLocale() {
  const { i18n: i18nInstance } = useTranslation();

  const setLocale = async (locale: SupportedLocale) => {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
    await i18nInstance.changeLanguage(locale);
  };

  return {
    locale: i18nInstance.language as SupportedLocale,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
    localeLabels: LOCALE_LABELS,
  };
}
