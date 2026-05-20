import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from './storage';

const INSTALLED_KEY = 'app.installed';

/**
 * Clears Keychain tokens on fresh install.
 * iOS Keychain survives uninstall; AsyncStorage does not — so a missing flag
 * means the app was just reinstalled and stale tokens must be wiped.
 */
export async function clearStaleTokensOnFreshInstall(): Promise<void> {
  const installed = await AsyncStorage.getItem(INSTALLED_KEY);
  if (!installed) {
    await tokenStorage.clear();
    await AsyncStorage.setItem(INSTALLED_KEY, '1');
  }
}
