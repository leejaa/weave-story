import { BrowserRouter, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/pages/LoadingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AnimatedRoutes } from '@/components/nav/AnimatedRoutes';
import { HomePage } from '@/pages/HomePage';
import { StoriesPage } from '@/pages/StoriesPage';
import { SetupPage } from '@/pages/SetupPage';
import { ReadingPage } from '@/pages/ReadingPage';

function AppRoutes() {
  const { state, login } = useAuth();

  if (state === 'loading') return <LoadingPage />;

  if (state === 'unauthenticated') {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AnimatedRoutes>
      <Route path="/" element={<HomePage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/reading/:threadId" element={<ReadingPage />} />
      {/* Task 7~10에서 라우트 추가 예정 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </AnimatedRoutes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
