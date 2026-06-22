// 다음 챕터 생성 프롬프트용: 직전 챕터 본문을 통째로(=수천 자) 넣지 않고, 독자의 선택이
// 이어지는 "결정 장면이 담긴 뒷부분"만 발췌한다. 앞부분 서사는 이미 이전 챕터 요약으로
// 커버되므로, 이렇게 입력을 줄이면 AI Gateway 페이로드·타임아웃·큐 메시지 크기가 작아진다.
// (분량을 키운 뒤 next-chapter 생성이 게이트웨이 실패로 재시도 누적되던 문제 완화.)
//
// 언어 중립: 잘림 표시는 말줄임표만 사용(스토리 언어와 무관하게 동작).
export function previousChapterExcerpt(content: string, maxChars = 1500): string {
  const text = content.trim();
  if (text.length <= maxChars) return text;

  let tail = text.slice(text.length - maxChars);
  // 중간 문장에서 시작하지 않도록, 발췌 앞쪽 가까이에 문단 경계가 있으면 거기서 자른다.
  const breakIdx = tail.indexOf('\n\n');
  if (breakIdx > -1 && breakIdx < maxChars * 0.3) tail = tail.slice(breakIdx + 2);

  return `…\n\n${tail.trim()}`;
}
