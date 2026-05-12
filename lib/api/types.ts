export type Story = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string;
  mood: string;
  coverImageUrl: string | null;
  estimatedChapters: number;
  createdAt: string;
};

export type ThreadWithStory = {
  threadId: string;
  status: string;
  currentChapter: number;
  progress: string;
  lastReadAt: string;
  storyId: string;
  title: string;
  slug: string;
  genre: string;
  mood: string;
  coverImageUrl: string | null;
  estimatedChapters: number;
  description: string | null;
};

export type ChapterOption = { index: number; text: string };

export type Chapter = {
  id: string;
  threadId: string;
  chapterNumber: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  options: ChapterOption[] | null;
  createdAt: string;
};

export type ThreadDetail = ThreadWithStory & {
  chapter: Chapter | null;
};
