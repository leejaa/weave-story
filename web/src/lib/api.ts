/**
 * API 클라이언트 — 기존 CF Worker API를 재사용
 */
import { Sentry } from '@/lib/sentry';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://weave-story-api.leejahun0.workers.dev';

let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function clearToken() {
  _token = null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch (err) {
    // 네트워크 오류 — 바로 파악되도록 Sentry로 보고.
    Sentry.captureException(err, { tags: { kind: 'network', path } });
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const apiErr = new ApiError(res.status, (body as { error?: string }).error ?? res.statusText, body);
    // 5xx(서버 오류)는 보고. 4xx(크레딧 부족·인증 등 정상 흐름)는 노이즈라 제외.
    if (res.status >= 500) {
      Sentry.captureException(apiErr, { tags: { kind: 'api_5xx', path }, extra: { status: res.status } });
    }
    throw apiErr;
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
