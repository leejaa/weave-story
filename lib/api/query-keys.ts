export const queryKeys = {
  sampleCards: () => ['sampleCards'] as const,
  threads: () => ['threads'] as const,
  threadDetail: (id: string) => ['threads', id] as const,
  stories: () => ['stories'] as const,
};
