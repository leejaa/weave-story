import type { ContinuationContext, SetupContext, StoryState } from '../ai/story-generation';
import type { StoryLang } from '../ai/story-lang';

type StoryGenerationJobBase = {
  jobId: string;
  enqueuedAt: string;
};

export type FirstChapterGenerationJob = StoryGenerationJobBase & {
  type: 'first-chapter';
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
};

export type NextChapterGenerationJob = StoryGenerationJobBase & {
  type: 'next-chapter';
  chapterId: string;
  genCtx: ContinuationContext;
};

// 의미적 품질 심사 잡 — 생성 호출과 분리해 별도 큐 잡으로 돌린다.
// (생성은 초장기 LLM 호출이라, 그 꼬리에 심사를 매달면 호출 수명 한계에서 잘려 누락된다.)
export type JudgeChapterJob = StoryGenerationJobBase & {
  type: 'judge-chapter';
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  language: StoryLang;
  chosenOption: string | null;
};

// 구조적 진행 상태(story_state) 갱신 잡 — 생성과 분리해 별도 큐 잡으로 돌린다.
// updateStoryState는 haiku LLM 호출이라 생성 꼬리에 두면 호출 수명 한계에서 잘린다.
// prevState 스냅샷(이 화 이전 상태)을 페이로드에 담아 멱등 보장(항상 같은 입력 → 동일 결과).
export type UpdateStateJob = StoryGenerationJobBase & {
  type: 'update-state';
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  estimatedChapters: number;
  language: StoryLang;
  chosenOption: string | null;
  prevState: StoryState | null;
};

export type StoryGenerationJob =
  | FirstChapterGenerationJob
  | NextChapterGenerationJob
  | JudgeChapterJob
  | UpdateStateJob;

function createJobId(type: StoryGenerationJob['type'], id: string): string {
  return `${type}:${id}:${Date.now()}`;
}

export function createFirstChapterGenerationJob(params: {
  storyId: string;
  threadId: string;
  chapterId: string;
  genCtx: SetupContext;
}): FirstChapterGenerationJob {
  return {
    type: 'first-chapter',
    jobId: createJobId('first-chapter', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}

export function createNextChapterGenerationJob(params: {
  chapterId: string;
  genCtx: ContinuationContext;
}): NextChapterGenerationJob {
  return {
    type: 'next-chapter',
    jobId: createJobId('next-chapter', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}

export function createJudgeChapterJob(params: {
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  language: StoryLang;
  chosenOption: string | null;
}): JudgeChapterJob {
  return {
    type: 'judge-chapter',
    jobId: createJobId('judge-chapter', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}

export function createUpdateStateJob(params: {
  threadId: string;
  chapterId: string;
  chapterNumber: number;
  estimatedChapters: number;
  language: StoryLang;
  chosenOption: string | null;
  prevState: StoryState | null;
}): UpdateStateJob {
  return {
    type: 'update-state',
    jobId: createJobId('update-state', params.chapterId),
    enqueuedAt: new Date().toISOString(),
    ...params,
  };
}
