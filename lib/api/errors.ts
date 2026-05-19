export class ApiError extends Error {
  constructor(
    public readonly status: number,
    serverMessage: string,
    public readonly userMessage: string,
  ) {
    super(serverMessage);
    this.name = 'ApiError';
  }
}

function statusToMessage(status: number): string {
  if (status === 401) return '로그인 세션이 만료됐어요. 앱을 다시 시작해 주세요.';
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status >= 500) return '서버에 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  return '요청을 처리하지 못했어요. 다시 시도해 주세요.';
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch'))
  );
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage;
  if (isNetworkError(error)) return '인터넷 연결을 확인한 후 다시 시도해 주세요.';
  if (error instanceof Error && error.message) return error.message;
  return '알 수 없는 오류가 발생했어요. 다시 시도해 주세요.';
}

export async function throwIfError(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const serverMessage = body.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, serverMessage, statusToMessage(res.status));
  }
}
