/** 서버 /api/sample-cards 응답 1건 (기존 앱 lib/api/types.ts SampleCardData 와 동일) */
export type SampleCardData = {
  id: string;
  genre: string;
  genreLabel: string;
  title: string;
  color: string;
  imageUrl: string | null;
  prompt: string;
  /** 로컬라이즈된 프롬프트 변형들(선택). 없으면 prompt 사용 */
  prompts?: string[];
  displayOrder: number;
};

export type Language = 'en' | 'ko' | 'ja';

/** 이야기 생성 (POST /api/stories) */
export type CreateStoryRequest = {
  prompt: string;
  estimatedChapters: number;
  language: Language;
};
export type CreateStoryResponse = { threadId: string };

/** 챕터/스레드 (GET /api/threads/:id) */
export type ChapterStatus = 'generating' | 'ready' | 'failed';
export type ChapterOption = { index: number; text: string };

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

export type Intervention = {
  id: string;
  threadId: string;
  chapterNumber: number;
  type: 'choice' | 'free_input';
  choiceIndex: number | null;
  freeText: string | null;
  createdAt: string;
};

export type ThreadDetail = {
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
  chapters: Chapter[];
  interventions: Intervention[];
};
