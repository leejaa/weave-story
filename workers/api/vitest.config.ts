import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Neon HTTP 라운드트립이 있어 기본보다 넉넉히.
    testTimeout: 20000,
    hookTimeout: 30000,
    // 같은 테스트 DB 브랜치를 공유하므로 파일 간 직렬 실행(상호 간섭 방지).
    fileParallelism: false,
  },
});
