/**
 * 챕터 본문을 페이지 단위로 분할 (기존 앱 lib/reading/paginate.ts 동일 접근).
 * 컨테이너 크기 기반으로 페이지당 글자 수를 추정해 문단을 채운다.
 * 첫 페이지는 챕터 제목 높이만큼 용량을 줄인다.
 */
const H_PADDING = 24;
const V_TOP = 20;
const V_BOTTOM = 24;
const TITLE_H = 40;
const LINE_H = 30;
const CHAR_W = 17.5; // Fraunces/한글 18px 평균 글자폭 근사
const FILL = 0.82; // 문단 여백 보정

function capacity(width: number, height: number, firstPage: boolean): number {
  const charsPerLine = Math.max(8, Math.floor((width - H_PADDING * 2) / CHAR_W));
  const usable = height - V_TOP - V_BOTTOM - (firstPage ? TITLE_H : 0);
  const lines = Math.max(4, Math.floor(usable / LINE_H));
  return Math.max(140, Math.floor(charsPerLine * lines * FILL));
}

export function paginate(content: string, width: number, height: number): string[] {
  if (!content.trim() || width < 100 || height < 100) return [content];
  const paras = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const pages: string[] = [];
  let cur = '';
  const limit = () => capacity(width, height, pages.length === 0);

  const hardSplit = (text: string) => {
    let rest = text;
    while (rest.length > limit()) {
      const cap = limit();
      let cut = rest.lastIndexOf(' ', cap);
      if (cut < cap * 0.5) cut = cap; // 공백이 없으면 그냥 잘라냄
      pages.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    return rest;
  };

  for (const p of paras) {
    const candidate = cur ? `${cur}\n\n${p}` : p;
    if (candidate.length <= limit()) {
      cur = candidate;
    } else {
      if (cur) {
        pages.push(cur);
        cur = '';
      }
      cur = hardSplit(p);
    }
  }
  if (cur.trim()) pages.push(cur.trim());
  return pages.length ? pages : [content];
}
