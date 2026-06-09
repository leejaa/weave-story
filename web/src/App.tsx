import { BrowserRouter, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/pages/LoadingPage';
import { LoginPage } from '@/pages/LoginPage';
import { BookExpandProvider } from '@/features/expand/BookExpand';
import { AnimatedRoutes } from '@/components/nav/AnimatedRoutes';
import { HomePage } from '@/pages/HomePage';
import { StoriesPage } from '@/pages/StoriesPage';
import { PreviewPage } from '@/pages/PreviewPage';
import { SetupPage } from '@/pages/SetupPage';
import { ReadingPage } from '@/pages/ReadingPage';
import { ProfilePage } from '@/pages/ProfilePage';

function AppRoutes() {
  const { state, login, loginDemo } = useAuth();

  if (state === 'loading') return <LoadingPage />;

  if (state === 'unauthenticated') {
    return <LoginPage onLogin={login} onDemoLogin={loginDemo} />;
  }

  return (
    <AnimatedRoutes>
      <Route path="/" element={<HomePage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/reading/:threadId" element={<ReadingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </AnimatedRoutes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BookExpandProvider>
          <AppRoutes />
        </BookExpandProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
