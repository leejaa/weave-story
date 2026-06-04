import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// React Native has no window focus event — wire AppState instead
if (Platform.OS !== 'web') {
  focusManager.setEventListener(handleFocus => {
    const sub = AppState.addEventListener('change', state => {
      handleFocus(state === 'active');
    });
    return () => sub.remove();
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Keep queries long enough that they survive in the persisted cache across
      // cold starts (the home shelf renders instantly from disk, then revalidates).
      gcTime: 24 * 60 * 60_000, // 24h
    },
  },
});

// Persist the query cache to disk so the main screen (sample books, etc.) paints
// immediately on app launch with the last data, then refreshes in the background.
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'weave-rq-cache-v1',
});

export const persistOptions = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24h — older snapshots are discarded
  buster: 'v1', // bump to invalidate all persisted cache on breaking changes
};
