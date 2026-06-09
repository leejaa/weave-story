import type { Variants } from 'motion/react';

/** 탭 화면(하단 탭바 유지) 여부 */
export function isTabRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/stories';
}

const EASE = [0.4, 0, 0.2, 1] as const;

/** 탭 전환: 크로스페이드 */
const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

/** 모달: 아래에서 위로 슬라이드 (셋업 등) */
const modalUp: Variants = {
  enter: { y: '100%' },
  center: { y: 0, transition: { type: 'spring', stiffness: 380, damping: 38 } },
  exit: { y: '100%', transition: { duration: 0.24, ease: EASE } },
};

/** 푸시/팝 가로 슬라이드 (리더 등). custom=방향(1 push / -1 pop) */
const slide: Variants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-28%' }),
  center: { x: 0, transition: { type: 'spring', stiffness: 380, damping: 40 } },
  exit: (d: number) => ({ x: d > 0 ? '-28%' : '100%', transition: { duration: 0.26, ease: EASE } }),
};

/** prefers-reduced-motion: transform 없이 빠른 페이드만 */
const reduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** 경로별 전환 변형 선택 */
export function variantsFor(pathname: string, reduceMotion: boolean): Variants {
  if (reduceMotion) return reduced;
  if (pathname.startsWith('/reading')) return slide;
  if (pathname.startsWith('/setup')) return modalUp;
  return fade; // 탭(/, /stories)
}
