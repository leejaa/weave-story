import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'weave:reading-position';

function getStorageKey(threadId: string): string {
  return `${STORAGE_PREFIX}:${threadId}`;
}

export async function getSavedReadingPageKey(threadId: string): Promise<string | null> {
  return AsyncStorage.getItem(getStorageKey(threadId));
}

export async function saveReadingPageKey(threadId: string, pageKey: string): Promise<void> {
  await AsyncStorage.setItem(getStorageKey(threadId), pageKey);
}
