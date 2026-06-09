import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { SampleCardData } from '@/lib/types';
import styles from './BookExpand.module.css';

export type ExpandRect = { top: number; left: number; width: number; height: number };

type ExpandApi = { start: (card: SampleCardData, rect: ExpandRect | null) => void };
const Ctx = createContext<ExpandApi>({ start: () => {} });

export const useBookExpand = () => useContext(Ctx);

/**
 * 카드 커버가 카드 위치/크기에서 풀스크린으로 확대된 뒤 미리보기로 넘어가는
 * hero(공유요소) 전환. 기존 앱 BookExpandTransition 대응.
 * Motion(rAF) 대신 CSS transition(transform, 컴포지터 구동)으로 구현해 어떤 환경에서도 매끄럽게.
 */
export function BookExpandProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<{ card: SampleCardData; rect: ExpandRect } | null>(null);

  const start = useCallback(
    (card: SampleCardData, rect: ExpandRect | null) => {
      if (!rect) {
        navigate('/preview', { state: { card } }); // 측정 실패 시 폴백
        return;
      }
      setActive({ card, rect });
    },
    [navigate],
  );

  return (
    <Ctx.Provider value={{ start }}>
      {children}
      {active && (
        <ExpandOverlay
          card={active.card}
          rect={active.rect}
          onPeak={() => navigate('/preview', { state: { card: active.card } })}
          onDone={() => setActive(null)}
        />
      )}
    </Ctx.Provider>
  );
}

const EXPAND_MS = 520;
const FADE_MS = 240;

function ExpandOverlay({
  card,
  rect,
  onPeak,
  onDone,
}: {
  card: SampleCardData;
  rect: ExpandRect;
  onPeak: () => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 콜백을 ref 로 잡아 effect 를 1회만 실행
  const onPeakRef = useRef(onPeak);
  const onDoneRef = useRef(onDone);
  onPeakRef.current = onPeak;
  onDoneRef.current = onDone;

  // FLIP(transform, 컴포지터 구동) + 타이머 시퀀싱(transitionend 의존 제거 → 어떤 환경에서도 단계 진행)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tx = rect.left + rect.width / 2 - vw / 2;
    const ty = rect.top + rect.height / 2 - vh / 2;
    const sx = rect.width / vw;
    const sy = rect.height / vh;

    // 카드 위치/크기에서 시작 → 동기 reflow → 풀스크린으로 확대
    el.style.transition = 'none';
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    el.getBoundingClientRect();
    el.style.transition = `transform ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = 'translate(0px, 0px) scale(1, 1)';

    const t1 = window.setTimeout(() => {
      onPeakRef.current(); // 미리보기로 네비게이트 (오버레이 아래에서 마운트)
      el.style.transition = `opacity ${FADE_MS}ms ease`;
      el.style.opacity = '0';
    }, EXPAND_MS);
    const t2 = window.setTimeout(() => onDoneRef.current(), EXPAND_MS + FADE_MS + 20);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [rect]);

  return (
    <div className={styles.overlay} aria-hidden>
      <div ref={ref} className={styles.fill} style={{ backgroundColor: card.color }}>
        {card.imageUrl && <img className={styles.img} src={card.imageUrl} alt="" draggable={false} />}
        <div className={styles.veil} />
      </div>
    </div>
  );
}
