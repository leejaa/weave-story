import { useEffect, useState } from 'react';

/**
 * 배경 루프 비디오 — 모바일(토스 웹뷰) 성능 최적화.
 * 작은 포스터(로컬 jpg)를 즉시 깔고, 무거운 R2 비디오는 첫 페인트 이후(idle)에 지연 로드해
 * 초기 로딩(JS·API)과 대역폭 경쟁을 피한다. preload="none"로 적극 선다운로드도 차단.
 */
export function BackgroundVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const [loadSrc, setLoadSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    if (w.requestIdleCallback) {
      idle = w.requestIdleCallback(() => setLoadSrc(src), { timeout: 2000 });
    } else {
      timer = setTimeout(() => setLoadSrc(src), 400);
    }
    return () => {
      if (idle != null) w.cancelIdleCallback?.(idle);
      if (timer) clearTimeout(timer);
    };
  }, [src]);

  return (
    <video
      className={className}
      src={loadSrc}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      aria-hidden
      // 포스터를 배경으로도 깔아 비디오 로드 전 즉시 첫 페인트 보장(웹뷰 안전장치).
      style={{ backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    />
  );
}
