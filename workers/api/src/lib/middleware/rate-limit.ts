import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AppEnv, WorkerEnv } from '../../types';

// Cloudflare Workers 네이티브 Rate Limiting 바인딩. KV/DO 없이 per-colo 슬라이딩 윈도우.
export type RateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> };

/** 클라이언트 IP (Cloudflare 신뢰 헤더). 인증 전 엔드포인트의 키로 사용. */
export function clientIp(c: Context<AppEnv>): string {
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
}

/**
 * 레이트 리밋 미들웨어. 바인딩이 없으면(로컬/테스트) 통과시킨다.
 * 한도 초과 시 429를 반환한다.
 */
export function rateLimit(
  pick: (env: WorkerEnv) => RateLimiter | undefined,
  keyFn: (c: Context<AppEnv>) => string,
) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const limiter = pick(c.env);
    if (!limiter) return next();

    const { success } = await limiter.limit({ key: keyFn(c) });
    if (!success) return c.json({ error: 'rate_limited' }, 429);

    return next();
  });
}
