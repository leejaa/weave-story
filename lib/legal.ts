import i18n from '@/lib/i18n';

// Public legal pages, served by the API worker in the user's language. Linked from
// login and the paywall, and used as the App Store Connect privacy policy URL.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function currentLang(): string {
  const l = (i18n.language || 'ko').slice(0, 2);
  return ['ko', 'en', 'ja'].includes(l) ? l : 'ko';
}

export const privacyUrl = (lang: string = currentLang()) => `${BASE_URL}/privacy?lang=${lang}`;
export const termsUrl = (lang: string = currentLang()) => `${BASE_URL}/terms?lang=${lang}`;
