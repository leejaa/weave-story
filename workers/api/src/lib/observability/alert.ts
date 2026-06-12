import { notifyOwner } from '../notify/owner';
import type { WorkerEnv } from '../../types';

/**
 * 서버 오류 "이정표" 알림 — 텔레그램으로 짧게 보낸다.
 *
 * 상세 로그(스택·컨텍스트)는 Cloudflare(logger.ts)에 남기고, 여기서는 "어디서·무슨
 * 에러·어떤 ray/id" 만 알려 운영자가 Cloudflare 로그를 바로 찾아갈 수 있게 한다.
 */

export type ServerErrorAlert = {
  /** 'request'(HTTP) | 'queue'(백그라운드 잡) */
  source: 'request' | 'queue';
  /** cf-ray(요청) 또는 jobId(큐). Cloudflare 로그의 requestId 와 동일. */
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  errorName?: string;
};

// 동일 오류가 짧은 시간에 폭주할 때 텔레그램 도배를 막는 best-effort 스로틀.
// 아이솔레이트 단위 메모리라 완벽하진 않지만(여러 아이솔레이트 가능) 가장 흔한
// "같은 라우트가 연속 터지는" 케이스를 효과적으로 억제한다.
const lastSentMs = new Map<string, number>();
const THROTTLE_MS = 60_000;

function throttled(key: string): boolean {
  const now = Date.now();
  const prev = lastSentMs.get(key);
  if (prev !== undefined && now - prev < THROTTLE_MS) return true;
  lastSentMs.set(key, now);
  return false;
}

export async function alertServerError(env: WorkerEnv, a: ServerErrorAlert): Promise<void> {
  const key = `${a.source}:${a.path ?? ''}:${a.errorName ?? ''}`;
  if (throttled(key)) return;

  const lines = [
    '🔴 서버 오류',
    a.source === 'queue' ? 'source: queue (백그라운드 잡)' : null,
    (a.method || a.path) ? `route: ${[a.method, a.path].filter(Boolean).join(' ')}` : null,
    a.status ? `status: ${a.status}` : null,
    a.errorName ? `error: ${a.errorName}` : null,
    a.requestId ? `ray/id: ${a.requestId}` : null,
    '↳ Cloudflare 로그에서 위 ray/id·route 로 상세 확인',
  ].filter(Boolean) as string[];

  await notifyOwner(env, lines.join('\n'));
}
