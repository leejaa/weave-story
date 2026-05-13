export type Story = {
  id: string;
  title: string | null;
  genre: string | null;
  mood: string | null;
  coverImageUrl: string | null;
  estimatedChapters: number;
  status: string;
  createdAt: string;
};

export type ThreadWithStory = {
  threadId: string;
  status: string;
  currentChapter: number;
  progress: string;
  lastReadAt: string;
  storyId: string;
  title: string | null;
  genre: string | null;
  mood: string | null;
  coverImageUrl: string | null;
  estimatedChapters: number;
};

export type ChapterOption = { index: number; text: string };

export type ChapterStatus = 'generating' | 'ready' | 'failed';

export type Chapter = {
  id: string;
  threadId: string;
  chapterNumber: number;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  options: ChapterOption[] | null;
  situation: string | null;
  question: string | null;
  status: ChapterStatus;
  createdAt: string;
};

export type ThreadDetail = ThreadWithStory & {
  chapters: Chapter[];
};
