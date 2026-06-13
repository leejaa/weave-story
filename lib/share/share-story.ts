import { Share } from 'react-native';
import i18n from '@/lib/i18n';
import { appStoreLink } from './store-links';
import { trackShare } from '@/lib/analytics';

// 완성/진행 중인 이야기를 텍스트로 공유한다(네이티브 공유 시트).
// 이미지 카드 공유는 네이티브 모듈(view-shot 등)이 필요해 별도 빌드에서 다룬다.
export async function shareStory(args: { title: string | null; threadId: string }): Promise<void> {
  const title = args.title?.trim() || i18n.t('share.untitled', { ns: 'reading' });
  const message = i18n.t('share.message', { ns: 'reading', title, link: appStoreLink() });

  try {
    const result = await Share.share({ message });
    if (result.action === Share.sharedAction) {
      void trackShare({ threadId: args.threadId });
    }
  } catch (err) {
    // 사용자가 공유 시트를 닫는 등은 정상 흐름 — 조용히 무시.
    console.warn('[share] failed', err);
  }
}
