import { useMemo } from 'react';
import type { SampleCardData } from '@/lib/types';
import type { ExpandRect } from '@/features/expand/BookExpand';
import { useBookExpand } from '@/features/expand/BookExpand';
import { useSampleCards } from '@/features/home/useSampleCards';
import { HomeBackground } from '@/components/home/HomeBackground';
import { HomeHeadline } from '@/components/home/HomeHeadline';
import { BookRail } from '@/components/home/BookRail';
import styles from './HomePage.module.css';

export function HomePage() {
  const { data: cards } = useSampleCards();
  const { start } = useBookExpand();

  // 카드별로 {제목, 프롬프트} 쌍을 한 번 랜덤 선택해 제목·프롬프트를 함께 고정한다.
  // (제목과 내용이 일치하도록 — 쌍이 깨지지 않게.) 홈 재진입(remount)마다 새로 뽑힌다.
  const displayCards = useMemo<SampleCardData[]>(
    () =>
      cards.map((card) => {
        const pool = card.samples?.length
          ? card.samples
          : [{ title: card.title, body: card.prompt }];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return { ...card, title: pick.title || card.title, prompt: pick.body };
      }),
    [cards],
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
