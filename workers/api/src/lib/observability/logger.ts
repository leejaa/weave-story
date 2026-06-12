/**
 * 구조화 로깅 — Cloudflare Workers 로그(Observability)에 "자세히" 남기기 위한 모듈.
 *
 * 한 줄 JSON 으로 출력해 Cloudflare 대시보드/`wrangler tail`/observability 쿼리에서
 * 필드(`path`, `requestId`, `error.name` 등)로 바로 필터·검색할 수 있게 한다.
 * 텔레그램 알림은 "이정표"일 뿐이고, 디버깅에 필요한 풀 컨텍스트는 전부 여기에 남는다.
 */

export type ErrorEvent =
  | 'request_error'        // Hono onError 로 잡힌 미처리 예외(→ 500)
  | 'queue_job_failed';    // 스토리 생성 큐 잡 최종 실패

export type ErrorLogContext = {
  event: ErrorEvent;
  /** 상관관계 키. 요청은 cf-ray, 큐 잡은 jobId. 알림 메시지의 ray/id 와 동일 값. */
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  userId?: string;
  durationMs?: number;
  /** 잡 타입, storyId, attempts 등 디버깅에 도움되는 임의 필드. */
  extra?: Record<string, unknown>;
};

function serializeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { name: 'NonError', message: typeof err === 'string' ? err : JSON.stringify(err) };
}

/**
 * 에러를 Cloudflare 로그에 구조화해 남긴다(가능한 한 자세히: 스택 포함).
 * 반환값 없음 — throw 하지 않는다.
 */
export function logError(err: unknown, ctx: ErrorLogContext): void {
  const payload = {
    level: 'error' as const,
    ts: new Date().toISOString(),
    ...ctx,
    error: serializeError(err),
  };
  // 한 줄 JSON: Cloudflare observability 에서 키 기반 검색이 쉬움.
  console.error(JSON.stringify(payload));
}
