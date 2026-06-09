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
    // 카드 선택 → 펼친 책 미리보기(중간 화면) → 탭 → 셋업
    navigate('/preview', { state: { card } });
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
