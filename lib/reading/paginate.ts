// Approximation-based text pagination for the e-reader view.
// Korean serif at 18px/30lh on a typical phone fits ~350–420 chars per page.
// First page reserves extra space for the chapter title.

const LINE_HEIGHT = 30;
const FONT_SIZE = 18;
const H_PADDING = 24; // each side
const RIBBON_HEIGHT = 82; // ribbon + safe area buffer
const CHAPTER_TITLE_HEIGHT = 36; // title line + margin
const V_PADDING_TOP = 20;
const V_PADDING_BOTTOM = 24;

export function calcCharsPerPage(
  screenWidth: number,
  screenHeight: number,
  firstPage = false,
): number {
  const contentWidth = screenWidth - H_PADDING * 2;
  // Korean chars in Fraunces 18px are roughly 17px wide on average
  const charsPerLine = Math.floor(contentWidth / 17);

  const titleOffset = firstPage ? CHAPTER_TITLE_HEIGHT : 0;
  const availableHeight =
    screenHeight - RIBBON_HEIGHT - V_PADDING_TOP - V_PADDING_BOTTOM - titleOffset;
  const linesPerPage = Math.floor(availableHeight / LINE_HEIGHT);

  // Subtract ~20% to account for paragraph gap lines
  return Math.floor(charsPerLine * linesPerPage * 0.8);
}

export function paginateText(
  text: string,
  charsPerFirstPage: number,
  charsPerPage: number,
): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const pages: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  const limitFor = (pageIndex: number) =>
    pageIndex === 0 ? charsPerFirstPage : charsPerPage;

  for (const para of paragraphs) {
    const sep = current.length > 0 ? 2 : 0; // '\n\n' separator
    const limit = limitFor(pages.length);

    if (currentLen + sep + para.length <= limit || current.length === 0) {
      current.push(para);
      currentLen += sep + para.length;
    } else {
      pages.push(current.join('\n\n'));
      current = [para];
      currentLen = para.length;
    }
  }

  if (current.length > 0) pages.push(current.join('\n\n'));
  return pages.length > 0 ? pages : [''];
}
