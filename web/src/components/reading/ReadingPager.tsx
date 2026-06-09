import { useEffect, useRef, type ReactNode } from 'react';
import styles from './ReadingPager.module.css';

type Props = {
  slides: ReactNode[];
  width: number;
  /** 부모가 이동시키려는 페이지 인덱스 */
  targetIndex: number;
  onVisibleChange: (index: number) => void;
};

/** 가로 스냅 페이저 — 한 슬라이드 = 한 페이지(컨테이너 폭). */
export function ReadingPager({ slides, width, targetIndex, onVisibleChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!width) return;
    ref.current?.scrollTo({ left: targetIndex * width, behavior: 'smooth' });
  }, [targetIndex, width]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || !width) return;
    onVisibleChange(Math.max(0, Math.round(el.scrollLeft / width)));
  };

  return (
    <div className={styles.pager} ref={ref} onScroll={handleScroll}>
      {slides.map((slide, i) => (
        <div key={i} className={styles.slide} style={{ width }}>
          {slide}
        </div>
      ))}
    </div>
  );
}
