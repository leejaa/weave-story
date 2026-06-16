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
    openChoice: '선택하러 가기',
    yourChoice: '당신의 선택',
  },
  generating: {
    title: '당신의 책을 펼치고 있어요',
    body: '첫 장면이 페이지 위에 자리 잡고 있어요.',
    estimate: '약 1-2분 소요',
    notify: '완성되면 알림 받기',
    notifyDone: '알림 설정 완료',
  },
  error: {
    title: '이야기를 펼치지 못했어요',
    body: '첫 장을 짓는 도중 문제가 생겼어요.\n크레딧은 그대로 있으니 다시 시도해 주세요.',
    retry: '다시 시도',
    back: '돌아가기',
  },
} as const;
