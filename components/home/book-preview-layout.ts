import type { BookOrigin } from './use-book-selection';

type Dimensions = {
  width: number;
  height: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BookPreviewLayout = {
  cover: {
    width: number;
    height: number;
    targetX: number;
    targetY: number;
    origin: BookOrigin;
  };
  leftPage: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  rightPage: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  closeTop: number;
};

const OPEN_BOOK_RECTS = {
  leftPage: { x: 0.14, y: 0.40, width: 0.31, height: 0.33 },
  rightPage: { x: 0.56, y: 0.38, width: 0.29, height: 0.40 },
} satisfies Record<string, Rect>;

function toAbsoluteRect(rect: Rect, dimensions: Dimensions) {
  return {
    left: dimensions.width * rect.x,
    top: dimensions.height * rect.y,
    width: dimensions.width * rect.width,
    height: dimensions.height * rect.height,
  };
}

export function getBookPreviewLayout(
  dimensions: Dimensions,
  origin: BookOrigin | null,
): BookPreviewLayout {
  const { width, height } = dimensions;
  const coverWidth = Math.min(width * 0.38, 152);
  const coverHeight = Math.min(coverWidth * 1.42, height * 0.35);
  const coverTargetX = (width - coverWidth) / 2;
  const coverTargetY = height * 0.33;
  const leftPage = toAbsoluteRect(OPEN_BOOK_RECTS.leftPage, dimensions);
  const rightPage = toAbsoluteRect(OPEN_BOOK_RECTS.rightPage, dimensions);

  return {
    cover: {
      width: coverWidth,
      height: coverHeight,
      targetX: coverTargetX,
      targetY: coverTargetY,
      origin: origin ?? {
        x: coverTargetX,
        y: coverTargetY,
        width: coverWidth,
        height: coverHeight,
      },
    },
    leftPage,
    rightPage,
    closeTop: Math.max(52, height * 0.07),
  };
}
