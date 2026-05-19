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

export type EndPageItem = { key: string; type: 'end' };

export type PageItem = TextPageItem | ChoicePageItem | GeneratingPageItem | InterventionPageItem | EndPageItem;
