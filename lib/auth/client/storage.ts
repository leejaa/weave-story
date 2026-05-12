import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'auth.access_token',
  refreshToken: 'auth.refresh_token',
} as const;

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(KEYS.accessToken),
  setAccessToken: (token: string) => SecureStore.setItemAsync(KEYS.accessToken, token),

  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token),

  clear: async () => {
    await SecureStore.deleteItemAsync(KEYS.accessToken);
    await SecureStore.deleteItemAsync(KEYS.refreshToken);
  },
};
