import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReadingChoiceScreen } from '@/components/reading/reading-choice-screen';

export default function ReadingChoiceRoute() {
  const router = useRouter();
  const { id, chapterNumber } = useLocalSearchParams<{ id: string; chapterNumber?: string }>();

  return (
    <ReadingChoiceScreen
      threadId={id}
      chapterNumber={chapterNumber}
      onClose={() => router.back()}
      onComplete={() => router.replace(`/reading/${id}`)}
    />
  );
}
