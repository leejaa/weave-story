/**
 * 오늘 날짜를 KST 기준 'YYYY-MM-DD' 문자열로. 일일 보상 등 "하루 1회" 경계 판정에 사용.
 * en-CA 로케일은 ISO(YYYY-MM-DD) 형식으로 포맷된다. Workers는 전체 ICU 지원.
 */
export function kstDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}
