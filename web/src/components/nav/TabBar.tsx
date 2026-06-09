import { Link, useLocation } from 'react-router-dom';
import styles from './TabBar.module.css';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** Feather 깃펜 아이콘 (새 이야기) — Feather 'feather' */
function FeatherIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

/** 북마크 아이콘 (내 이야기) — focused 시 채움 */
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v15l-5.5-3.4L6.5 19.5V5A1.5 1.5 0 0 1 8 3.5z" />
    </svg>
  );
}

const TABS = [
  { to: '/', label: '새 이야기', icon: 'feather' as const },
  { to: '/stories', label: '내 이야기', icon: 'bookmark' as const },
];

/** 하단 탭바 — 기존 (tabs)/_layout.tsx 와 동일: 홈 투명 / 그 외 크림, active=thread. */
export function TabBar() {
  const { pathname } = useLocation();
  const transparent = pathname === '/';

  return (
    <nav className={cx(styles.bar, transparent ? styles.transparent : styles.solid)}>
      {TABS.map((t) => {
        const active = t.to === '/' ? pathname === '/' : pathname.startsWith(t.to);
        return (
          <Link key={t.to} to={t.to} className={cx(styles.tab, active && styles.active)}>
            {t.icon === 'feather' ? <FeatherIcon /> : <BookmarkIcon filled={active} />}
            <span className={styles.label}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
