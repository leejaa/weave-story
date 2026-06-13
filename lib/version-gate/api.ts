const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export type PlatformConfig = {
  minSupported: string;
  latest: string;
  storeUrl: string;
};

export type AppConfig = Partial<Record<'ios' | 'android', PlatformConfig>>;

/** 공개 버전 게이트 설정을 가져온다. 실패(네트워크/서버) 시 null → 호출부에서 fail-open. */
export async function fetchAppConfig(signal?: AbortSignal): Promise<AppConfig | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/app-config`, { signal });
    if (!res.ok) return null;
    return (await res.json()) as AppConfig;
  } catch {
    return null;
  }
}
