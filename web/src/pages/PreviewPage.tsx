import { useLocation, useNavigate } from 'react-router-dom';
import type { SampleCardData } from '@/lib/types';
import { BookPreview } from '@/components/home/BookPreview';

type PreviewState = { card?: SampleCardData };

/** 카드 → 펼친 책 미리보기 → (탭) 셋업. 홈과 셋업 사이의 중간 화면. */
export function PreviewPage() {
  const navigate = useNavigate();
  const card = (useLocation().state as PreviewState | null)?.card;

  if (!card) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <BookPreview
      card={card}
      onClose={() => navigate(-1)}
      onStart={() => navigate('/setup', { state: { prompt: card.prompt }, replace: true })}
    />
  );
}
