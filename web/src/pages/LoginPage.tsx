import { useState } from 'react';
import { MEDIA } from '@/lib/media';
import { Spinner } from '@/components/ui';
import { BackgroundVideo } from '@/components/ui/BackgroundVideo';
import styles from './LoginPage.module.css';

type Props = {
  onLogin: () => Promise<void>;
};

/**
 * 로그인 게이트 — 기존 앱 login.tsx 와 동일 구조: 다크 비디오 배경 + 브랜드 + 헤드라인 + 하단 CTA.
 * TEMP: 브라우저에선 '토스로 시작하기' 가 자동 리뷰어 로그인으로 이어진다(lib/auth loginWithToss 분기).
 */
export function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch {
      setError('로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <BackgroundVideo className={styles.video} src={MEDIA.loginVideo} poster={MEDIA.loginPoster} />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.diamond} />
          <span className={styles.wordmark}>실마리</span>
        </div>

        <div className={styles.headline}>
          <h1 className={styles.title}>실마리</h1>
          <p className={styles.subtitle}>Your stories, woven together.</p>
        </div>

        <div className={styles.spacer} />

        <div className={styles.actions}>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.tossBtn} onClick={handleLogin} disabled={loading}>
            {loading ? <Spinner size={20} tone="light" /> : '토스로 시작하기'}
          </button>
          <p className={styles.legal}>계속하면 서비스 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.</p>
        </div>
      </div>
    </div>
  );
}
