export const queryKeys = {
  sampleCards: (lang: string) => ['sampleCards', lang] as const,
  threads: () => ['threads'] as const,
  threadDetail: (id: string) => ['threads', id] as const,
  stories: () => ['stories'] as const,
};
