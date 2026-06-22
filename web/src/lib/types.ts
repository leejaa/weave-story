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

export type Language = 'en' | 'ko' | 'ja' | 'zh-Hant';

/** 이야기 생성 (POST /api/stories) */
export type CreateStoryRequest = {
  prompt: string;
  estimatedChapters: number;
  language: Language;
  /** 샘플카드에서 선택한 장르 힌트 (FANTASY, ROMANCE 등). 서버에서 장르 이탈 방지에 사용. */
  hintGenre?: string;
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

/** 내 계정/크레딧 (GET /api/me) — 기존 앱 MeResult 와 동일 */
export type MeResult = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  credits: number;
};

/** 내 이야기 목록 1건 (GET /api/threads) — 기존 앱 ThreadWithStory 와 동일 */
export type ThreadListItem = {
  threadId: string;
  status: string; // 'completed' | 그 외(진행 중)
  currentChapter: number;
  progress: string; // 0~1 문자열
  lastReadAt: string;
  storyId: string;
  title: string | null;
  genre: string | null;
  mood: string | null;
  coverImageUrl: string | null;
  estimatedChapters: number;
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
