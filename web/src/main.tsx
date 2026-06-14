import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.css';
import App from './App';
import { initSentry, Sentry } from '@/lib/sentry';
import { applyEnvClasses } from '@/lib/env';

applyEnvClasses();
initSentry();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 24, textAlign: 'center' }}>문제가 발생했어요. 앱을 다시 열어주세요.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
