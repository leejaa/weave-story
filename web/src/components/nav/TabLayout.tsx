import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import styles from './TabLayout.module.css';

/** 탭 화면(홈/내 이야기) 공통 레이아웃 — 콘텐츠는 풀하이트로 깔고 탭바를 띄운다. */
export function TabLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.outlet}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
