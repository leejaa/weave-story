import type { ThreadListItem } from '@/lib/types';
import { MEDIA } from '@/lib/media';

/**
 * 데모(미인증) 모드용 내 이야기 목록.
 * 진행 중 2건 + 완결 1건으로 섹션 분기를 시연한다.
 * 첫 번째 진행중 카드는 reading 데모 스레드(mock-rofan)와 연결.
 */
export const MOCK_THREADS: ThreadListItem[] = [
  {
    threadId: 'mock-rofan',
    status: 'active',
    currentChapter: 1,
    progress: '0.000',
    lastReadAt: '2026-06-08T09:00:00.000Z',
    storyId: 'mock-story-rofan',
    title: '공작이 나를 선택했다',
    genre: '로맨스 판타지',
    mood: '설렘',
    coverImageUrl: MEDIA.cover('card-rofan'),
    estimatedChapters: 3,
  },
  {
    threadId: 'mock-mystery',
    status: 'active',
    currentChapter: 4,
    progress: '0.571',
    lastReadAt: '2026-06-07T21:30:00.000Z',
    storyId: 'mock-story-mystery',
    title: '7번째 손님은 돌아오지 않았다',
    genre: '미스터리',
    mood: '긴장',
    coverImageUrl: MEDIA.cover('card-mystery'),
    estimatedChapters: 7,
  },
  {
    threadId: 'mock-fantasy',
    status: 'completed',
    currentChapter: 5,
    progress: '1.000',
    lastReadAt: '2026-06-05T14:10:00.000Z',
    storyId: 'mock-story-fantasy',
    title: '마지막 마법사의 유언',
    genre: '판타지',
    mood: '장엄',
    coverImageUrl: MEDIA.cover('card-fantasy'),
    estimatedChapters: 5,
  },
];
