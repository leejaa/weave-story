import i18n from '@/lib/i18n';

// Error copy lives in the `common` namespace (i18n.t default ns) so messages
// follow the active locale even though this module is not a React component.
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
  if (status === 401) return i18n.t('errors.sessionExpired');
  if (status === 403) return i18n.t('errors.forbidden');
  if (status === 429) return i18n.t('errors.tooManyRequests');
  if (status >= 500) return i18n.t('errors.server');
  return i18n.t('errors.requestFailed');
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
  if (isNetworkError(error)) return i18n.t('errors.network');
  if (error instanceof Error && error.message) return error.message;
  return i18n.t('errors.unknown');
}

export async function throwIfError(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const serverMessage = body.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, serverMessage, statusToMessage(res.status));
  }
}
