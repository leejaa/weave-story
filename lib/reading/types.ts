import type { ChapterOption } from '@/lib/api/types';

export type TextPageItem = {
  key: string; type: 'text';
  chapterNumber: number;
  content: string; pageIndex: number; totalPages: number;
  chapterTitle: string | null;
};

export type ChoicePageItem = {
  key: string; type: 'choice';
  chapterNumber: number;
  options: ChapterOption[];
  situation: string | null;
  question: string | null;
};

export type GeneratingPageItem = { key: string; type: 'generating'; chapterNumber: number };

export type InterventionPageItem = { key: string; type: 'intervention'; chapterNumber: number; text: string };

// 모더레이션으로 숨김 처리된 챕터 — 본문 대신 안내를 보여준다.
export type HiddenPageItem = { key: string; type: 'hidden'; chapterNumber: number };

export type EndPageItem = { key: string; type: 'end' };

// 1화 앞 표지 — 이 이야기를 만든 원본 프롬프트를 먼저 보여준다.
export type PromptPageItem = { key: string; type: 'prompt'; prompt: string };

export type PageItem = PromptPageItem | TextPageItem | ChoicePageItem | GeneratingPageItem | InterventionPageItem | HiddenPageItem | EndPageItem;
