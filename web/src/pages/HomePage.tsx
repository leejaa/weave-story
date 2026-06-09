import { useNavigate } from 'react-router-dom';
import type { SampleCardData } from '@/lib/types';
import { useSampleCards } from '@/features/home/useSampleCards';
import { HomeBackground } from '@/components/home/HomeBackground';
import { HomeHeadline } from '@/components/home/HomeHeadline';
import { BookRail } from '@/components/home/BookRail';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const { data: cards } = useSampleCards();

  const handleSelect = (card: SampleCardData) => {
    // 카드 선택 → 셋업 화면으로 프롬프트 전달 (Task 5에서 입력/생성 처리)
    navigate('/setup', { state: { prompt: card.prompt, card } });
  };

  return (
    <div className={styles.screen}>
      <HomeBackground />
      <div className={styles.content}>
        <HomeHeadline />
        <div className={styles.railWrap}>
          <BookRail cards={cards} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
