import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

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
      gcTime: 5 * 60_000,
    },
  },
});
