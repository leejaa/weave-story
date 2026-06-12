import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // 실기기 Wi-Fi 연결을 위해 host 노출
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        // 실제 앱 진입점 (토스 로그인 게이트)
        main: path.resolve(__dirname, 'index.html'),
        // 인증 우회 미리보기 페이지 — 배포 URL에서 진행상황 바로 확인용
        home: path.resolve(__dirname, 'home.html'),
        gallery: path.resolve(__dirname, 'gallery.html'),
      },
      output: {
        // 안정적인 외부 라이브러리를 단일 vendor 청크로 분리 — 자주 바뀌는 앱 코드와 캐시 수명을 분리한다
        // (immutable 헤더와 결합 시 재방문에서 vendor는 캐시 적중, 앱 코드만 갱신).
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
