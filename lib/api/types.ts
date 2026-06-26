export type SampleCardData = {
  id: string;
  genre: string;
  genreLabel: string;
  title: string;
  color: string;
  imageUrl: string | null;
  prompt: string;
  prompts: string[];
  /** 제목+프롬프트 쌍 풀(서버 DB). 카드 렌더 시 하나를 랜덤 선택해 제목·프롬프트로 쓴다. */
  samples?: { title: string; body: string }[];
  displayOrder: number;
};

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

// 'ok' = 정상, 'reported' = 신고 접수(여전히 노출), 'hidden' = 자동/수동 숨김(본문 비노출)
export type ModerationStatus = 'ok' | 'reported' | 'hidden';

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
  moderationStatus: ModerationStatus;
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

export type ThreadDetail = ThreadWithStory & {
  // 원본 생성 프롬프트(사용자 입력 또는 샘플카드 전제). 1화 앞 표지 페이지에 노출.
  prompt: string | null;
  chapters: Chapter[];
  interventions: Intervention[];
};
