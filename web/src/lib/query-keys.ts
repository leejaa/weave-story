/** 쿼리 키 팩토리 — 캐시 무효화/참조를 한곳에서 관리 */
export const queryKeys = {
  sampleCards: (lang: string) => ['sample-cards', lang] as const,
  threads: () => ['threads'] as const,
  thread: (threadId: string) => ['threads', threadId] as const,
};
