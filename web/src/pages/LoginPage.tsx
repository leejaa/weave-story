import { useState } from 'react';
import { MEDIA } from '@/lib/media';
import { isInTossApp } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import styles from './LoginPage.module.css';

type Props = {
  onLogin: () => Promise<void>;
  /** 리뷰어(데모) 코드 로그인 — 브라우저에서 실서버 세션 테스트용. 없으면 미노출. */
  onDemoLogin?: (code: string) => Promise<void>;
};

/** 로그인 게이트 — 기존 앱 login.tsx 와 동일 구조: 다크 비디오 배경 + 브랜드 + 헤드라인 + 하단 CTA. */
export function LoginPage({ onLogin, onDemoLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');

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

  const handleDemoLogin = async () => {
    if (!onDemoLogin || !code.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onDemoLogin(code);
    } catch {
      setError('코드가 올바르지 않아요.');
    } finally {
      setLoading(false);
    }
  };

  // 리뷰어 코드 로그인은 토스 앱 밖(브라우저)에서만 노출
  const showReviewer = !!onDemoLogin && !isInTossApp();

  return (
    <div className={styles.screen}>
      <video className={styles.video} src={MEDIA.loginVideo} autoPlay loop muted playsInline preload="auto" aria-hidden />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.diamond} />
          <span className={styles.wordmark}>WEAVE STORY</span>
        </div>

        <div className={styles.headline}>
          <h1 className={styles.title}>Weave Story</h1>
          <p className={styles.subtitle}>Your stories, woven together.</p>
        </div>

        <div className={styles.spacer} />

        <div className={styles.actions}>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.tossBtn} onClick={handleLogin} disabled={loading}>
            {loading ? <Spinner size={20} tone="light" /> : '토스로 시작하기'}
          </button>
          <p className={styles.legal}>계속하면 서비스 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.</p>

          {showReviewer &&
            (showCode ? (
              <div className={styles.reviewer}>
                <input
                  className={styles.codeInput}
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDemoLogin()}
                  placeholder="리뷰어 코드"
                  autoFocus
                  disabled={loading}
                />
                <button
                  className={styles.codeBtn}
                  onClick={handleDemoLogin}
                  disabled={loading || !code.trim()}
                >
                  확인
                </button>
              </div>
            ) : (
              <button className={styles.reviewerToggle} onClick={() => setShowCode(true)}>
                리뷰어 코드로 로그인
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
