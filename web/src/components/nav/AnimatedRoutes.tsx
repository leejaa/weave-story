import type { ReactNode } from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TabBar } from './TabBar';
import { useNavDirection } from './useNavDirection';
import { isTabRoute, variantsFor } from './transitions';
import styles from './AnimatedRoutes.module.css';

type Props = { children: ReactNode };

/**
 * 라우트 전환 셸 — Motion AnimatePresence 로 화면을 겹쳐 애니메이트.
 * - 경로별 변형: 리더=가로 슬라이드(방향), 셋업=모달 업, 탭=페이드
 * - history idx 를 z-index 로 사용 → push 는 새 화면 위, pop 은 나가는 화면 위
 * - 탭 화면일 때만 하단 탭바를 지속 렌더
 * - prefers-reduced-motion 이면 transform 없이 빠른 페이드만
 */
export function AnimatedRoutes({ children }: Props) {
  const location = useLocation();
  const { dir, idx } = useNavDirection();
  const reduce = useReducedMotion() ?? false;

  return (
    <div className={styles.root}>
      <AnimatePresence custom={dir} initial={false}>
        <motion.div
          key={location.pathname}
          className={styles.layer}
          style={{ zIndex: idx }}
          custom={dir}
          variants={variantsFor(location.pathname, reduce)}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <Routes location={location}>{children}</Routes>
        </motion.div>
      </AnimatePresence>
      {isTabRoute(location.pathname) && <TabBar />}
    </div>
  );
}
