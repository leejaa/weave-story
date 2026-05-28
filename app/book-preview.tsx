import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookPreviewScreen } from '@/components/home/book-preview-screen';
import type { SampleCardData } from '@/lib/api/types';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BookPreviewRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const card = useMemo<SampleCardData>(() => ({
    id: getParam(params.id) ?? 'sample-preview',
    genre: getParam(params.genre) ?? '',
    genreLabel: getParam(params.genreLabel) ?? '',
    title: getParam(params.title) ?? '',
    color: getParam(params.color) ?? '#1c1712',
    imageUrl: getParam(params.imageUrl) ?? null,
    prompt: getParam(params.prompt) ?? '',
    displayOrder: Number(getParam(params.displayOrder) ?? 0),
  }), [params]);

  return (
    <BookPreviewScreen
      card={card}
      onClose={() => router.back()}
      onStart={() => {
        router.replace({ pathname: '/setup', params: { initialPrompt: card.prompt } });
      }}
    />
  );
}
