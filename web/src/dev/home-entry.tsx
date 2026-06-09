import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import '@/styles/global.css';
import { HomePage } from '@/pages/HomePage';
import { SetupPage } from '@/pages/SetupPage';
import { LoginPage } from '@/pages/LoginPage';

// 인증 게이트를 우회해 홈/셋업/로그인 화면만 미리보는 개발용 엔트리 (프로덕션 미포함)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage onLogin={async () => {}} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
