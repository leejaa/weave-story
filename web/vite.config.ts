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
  },
});
