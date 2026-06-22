import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import styles from './BookFlip.module.css';

type Props = {
  /** 로티 크기(px) */
  size?: number;
  /** 전체 화면 중앙 정렬 + 크림 배경. 풀스크린은 더 크게 표시. */
  fullscreen?: boolean;
};

// public/ 정적 경로(직접 생성한 웹 호환 로티). scripts/gen-loader-lottie.mjs 로 재생성.
const ANIMATION_PATH = '/animations/story-loader.json';

/**
 * 로딩/생성 중 표시되는 "책 펼침 + 금빛" 로티 애니메이션.
 * lottie-web 직접 사용(ref + cleanup) — React 18 StrictMode 이중 마운트에서도 안전.
 */
export function BookFlip({ size = 190, fullscreen = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dim = fullscreen ? Math.max(size, 260) : size;

  useEffect(() => {
    if (!ref.current) return;
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: ANIMATION_PATH,
    });
    return () => anim.destroy();
  }, []);

  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label="불러오는 중"
    >
      <div ref={ref} style={{ width: dim, height: dim }} aria-hidden />
    </div>
  );
}
