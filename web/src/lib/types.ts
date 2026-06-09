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
