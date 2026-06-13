import { Hono } from 'hono';
import { makeDb } from '../lib/db';
import { appConfig } from '../lib/schema';
import type { AppEnv } from '../types';

export const appConfigRouter = new Hono<AppEnv>();

// 공개 엔드포인트(인증 불필요). 앱이 실행 시 호출해 강제/권장 업데이트 게이트를 판단한다.
// 플랫폼별 minSupported(이 버전 미만이면 강제) / latest(권장 기준) / 스토어 URL을 반환.
appConfigRouter.get('/', async (c) => {
  const db = makeDb(c.env.DATABASE_URL);
  const rows = await db.select().from(appConfig);
  const out: Record<string, { minSupported: string; latest: string; storeUrl: string }> = {};
  for (const r of rows) {
    out[r.platform] = { minSupported: r.minSupported, latest: r.latest, storeUrl: r.storeUrl };
  }
  return c.json(out);
});
