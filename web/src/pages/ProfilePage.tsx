import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/lib/api';
import { logout } from '@/lib/auth';
import { useMe } from '@/features/me/useMe';
import { deleteMe } from '@/features/me/api';
import styles from './ProfilePage.module.css';

/**
 * 프로필 — 기존 앱 app/profile.tsx 대응.
 * 계정(아바타/이름/이메일) + 크레딧 + 로그아웃 + 회원탈퇴.
 * (언어 선택은 웹 i18n 도입 후 추가 예정 — 현재 한국어 전용.)
 * 내 이야기 헤더의 사용자 아이콘에서 진입.
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const { me } = useMe();
  const [busy, setBusy] = useState(false);

  // 세션 정리 후 로그인 게이트로 풀 리로드 (인증 상태 재평가)
  const toLoginGate = () => {
    logout();
    window.location.assign(import.meta.env.BASE_URL || '/');
  };

  const handleSignOut = () => {
    if (window.confirm('로그아웃 하시겠어요?')) toLoginGate();
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm(
      '계정과 모든 데이터(스토리, 남은 크레딧 포함)가 영구적으로 삭제되며 되돌릴 수 없습니다. 정말 탈퇴하시겠어요?',
    );
    if (!ok) return;
    try {
      setBusy(true);
      if (getToken()) await deleteMe(); // 데모(미인증)는 서버 호출 없이 세션만 정리
      toLoginGate();
    } catch {
      setBusy(false);
      window.alert('문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const initial = (me?.name ?? me?.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* 계정 */}
        <section className={styles.section}>
          {me?.avatarUrl ? (
            <img className={styles.avatar} src={me.avatarUrl} alt="" />
          ) : (
            <div className={`${styles.avatar} ${styles.avatarFallback}`}>
              <span className={styles.avatarLetter}>{initial}</span>
            </div>
          )}
          {me?.name && <p className={styles.displayName}>{me.name}</p>}
          <p className={styles.email}>{me?.email ?? me?.id ?? '—'}</p>
        </section>

        {/* 크레딧 */}
        <section className={styles.section}>
          <p className={styles.label}>요금제</p>
          <p className={styles.planDesc}>크레딧 {me?.credits ?? 0}개 남음</p>
        </section>

        {/* 액션 */}
        <button className={styles.signOut} onClick={handleSignOut} disabled={busy} type="button">
          로그아웃
        </button>
        <button className={styles.delete} onClick={handleDeleteAccount} disabled={busy} type="button">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
