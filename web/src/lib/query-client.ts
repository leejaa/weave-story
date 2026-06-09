import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1분
      retry: (failureCount, error) => {
        // 401은 재시도 안 함
        if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
