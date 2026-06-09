/** 읽기/선택 화면 ko 카피 (기존 앱 locales/ko/reading.json 대응) */
export const READING_COPY = {
  nowReading: '읽고 있는 장',
  end: '— 끝 —',
  choice: {
    defaultQuestion: '어떻게 할 것인가?',
    orInput: '또는 직접 입력',
    inputPlaceholder: '원하는 행동을 직접 입력하세요…',
    continue: '이야기 계속하기',
    entryKicker: '선택의 순간',
  },
  generating: {
    title: '당신의 책을 펼치고 있어요',
    body: '다음 장면이 페이지 위에 자리 잡고 있어요.',
    estimate: '약 1-2분 소요',
  },
} as const;
