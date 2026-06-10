import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import styles from './ReadingPager.module.css';

type Props = {
  slides: ReactNode[];
  width: number;
  /** 부모가 이동시키려는 페이지 인덱스 */
  targetIndex: number;
  onVisibleChange: (index: number) => void;
};

/**
 * 가로 페이저 — 한 슬라이드 = 한 페이지(컨테이너 폭).
 * 기존 앱 FlatList(pagingEnabled)처럼 **한 스와이프에 정확히 한 장**만 넘어가도록
 * transform 캐러셀 + 포인터 제스처로 구현(관성 fling으로 여러 장 넘어가는 문제 제거).
 * 세로(touch-action: pan-y)는 네이티브 스크롤로 본문 내부 스크롤과 공존.
 */
export function ReadingPager({ slides, width, targetIndex, onVisibleChange }: Props) {
  const count = slides.length;
  const [index, setIndex] = useState(() => clampIdx(targetIndex, count));
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const g = useRef<{ x: number; y: number; axis: 'x' | 'y' | null; id: number; dx: number }>({
    x: 0,
    y: 0,
    axis: null,
    id: -1,
    dx: 0,
  });

  // 부모 targetIndex 변경 시 동기화
  useEffect(() => {
    setIndex(clampIdx(targetIndex, count));
  }, [targetIndex, count]);

  // 현재 페이지를 부모에 알림
  useEffect(() => {
    onVisibleChange(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    g.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId, dx: 0 };
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (g.current.id !== e.pointerId) return;
    const dx = e.clientX - g.current.x;
    const dy = e.clientY - g.current.y;

    if (g.current.axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      g.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.current.axis === 'x') {
        setDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* 합성 이벤트 등에서 무시 */
        }
      }
    }
    if (g.current.axis !== 'x') return; // 세로 제스처는 네이티브 스크롤에 맡김

    // 끝에서는 저항을 줘 더 끌리지 않게
    let d = dx;
    if ((index === 0 && d > 0) || (index === count - 1 && d < 0)) d *= 0.35;
    g.current.dx = d; // 결정에 쓸 실시간 값(렌더 타이밍 무관)
    setDrag(d);
  };

  const endGesture = (e: RPointerEvent<HTMLDivElement>) => {
    if (g.current.id !== e.pointerId) return;
    if (g.current.axis === 'x') {
      const threshold = Math.min(64, width * 0.18);
      const d = g.current.dx;
      let next = index;
      if (d <= -threshold) next = index + 1; // 한 번에 한 장만
      else if (d >= threshold) next = index - 1;
      setIndex(clampIdx(next, count));
    }
    g.current = { x: 0, y: 0, axis: null, id: -1, dx: 0 };
    setDragging(false);
    setDrag(0);
  };

  return (
    <div
      className={styles.pager}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
    >
      <div
        className={styles.track}
        style={{
          transform: `translateX(${-index * width + drag}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className={styles.slide} style={{ width }}>
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}

function clampIdx(i: number, count: number) {
  return Math.max(0, Math.min(i, Math.max(0, count - 1)));
}
