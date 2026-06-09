import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // TODO: 앱인토스 콘솔에서 앱 등록 후 실제 appName으로 교체
  appName: 'weave-story',
  brand: {
    displayName: 'Weave Story',
    primaryColor: '#2D5A3D',
    icon: 'https://static.toss.im/appsintoss/weave-story-icon.png', // TODO: 아이콘 업로드 후 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});
