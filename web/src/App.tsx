import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/pages/LoadingPage';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { SetupPage } from '@/pages/SetupPage';

function AppRoutes() {
  const { state, login } = useAuth();

  if (state === 'loading') return <LoadingPage />;

  if (state === 'unauthenticated') {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={<SetupPage />} />
      {/* Task 6~10에서 라우트 추가 예정 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
