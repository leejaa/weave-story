export const queryKeys = {
  threads: () => ['threads'] as const,
  threadDetail: (id: string) => ['threads', id] as const,
  stories: () => ['stories'] as const,
};
