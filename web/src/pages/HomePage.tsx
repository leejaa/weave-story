import { useEffect, useMemo, useState } from 'react';
import type { SampleCardData } from '@/lib/types';
import type { ExpandRect } from '@/features/expand/BookExpand';
import { useBookExpand } from '@/features/expand/BookExpand';
import { useSampleCards } from '@/features/home/useSampleCards';
import { HomeBackground } from '@/components/home/HomeBackground';
import { HomeHeadline } from '@/components/home/HomeHeadline';
import { BookRail } from '@/components/home/BookRail';
import styles from './HomePage.module.css';

export function HomePage() {
  const { data: cards = [] } = useSampleCards();
  const { start } = useBookExpand();

  // 재진입마다 카드 제목·프롬프트를 새로 뽑기 위한 seed. 앱인토스 웹뷰는 나갔다 들어와도
  // 페이지를 유지(remount 안 함)하므로, 화면이 다시 보일 때(visibility/bfcache 복원)마다 갱신한다.
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const bump = () => setSeed((s) => s + 1);
    const onVisible = () => { if (document.visibilityState === 'visible') bump(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', bump); // bfcache 복원
    window.addEventListener('focus', bump);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);

  // 카드별로 {제목, 프롬프트} 쌍을 랜덤 선택해 제목·프롬프트를 함께 고정한다(쌍이 깨지지 않게).
  // seed가 바뀔 때마다(재진입) 새로 뽑힌다.
  const displayCards = useMemo<SampleCardData[]>(
    () =>
      cards.map((card) => {
        const pool = card.samples?.length
          ? card.samples
          : [{ title: card.title, body: card.prompt }];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return { ...card, title: pick.title || card.title, prompt: pick.body };
      }),
    [cards, seed],
  );

  const handleSelect = (card: SampleCardData, rect: ExpandRect | null) => {
    // 제목·프롬프트는 displayCards에서 이미 한 쌍으로 정해졌다. 그대로 사용.
    start(card, rect);
  };

  return (
    <div className={styles.screen}>
      <HomeBackground />
      <div className={styles.content}>
        <HomeHeadline />
        <div className={styles.railWrap}>
          <BookRail cards={displayCards} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
