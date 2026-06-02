// Public legal pages, served by the API worker. Linked from login and the paywall,
// and used as the App Store Connect privacy policy URL.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const PRIVACY_URL = `${BASE_URL}/privacy`;
export const TERMS_URL = `${BASE_URL}/terms`;
