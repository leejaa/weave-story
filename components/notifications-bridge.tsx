import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { useAuth } from '@/lib/auth/client/context';
import { registerForPushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/api/query-keys';
import { fetchThreadDetail } from '@/lib/api/fetch';

type NotifData = { url?: string; threadId?: string; chapterNumber?: number };

// 푸시로 알려진 스레드를 미리 react-query 캐시에 채워, 탭 시 리더가 네트워크 대기 없이
// 즉시 렌더되게 한다(staleTime:0으로 새 챕터를 강제로 받아온다). best-effort — 실패 무시.
function prefetchThread(threadId: string): void {
  void queryClient
    .prefetchQuery({
      queryKey: queryKeys.threadDetail(threadId),
      queryFn: () => fetchThreadDetail(threadId),
      staleTime: 0,
    })
    .catch(() => {});
}

function threadIdOf(notification: Notifications.Notification | undefined | null): string | null {
  const data = notification?.request?.content?.data as NotifData | undefined;
  return data?.threadId ?? null;
}

/**
 * Wires push notifications into the app tree:
 * - silently (re)registers the device token once the user is authenticated
 *   (no permission prompt — that happens contextually on the generating screen),
 * - prefetches the chapter as soon as the notification is RECEIVED, so the reader
 *   paints instantly when the user later taps (A),
 * - deep-links to the story when a notification is tapped (warm or cold start),
 *   kicking the prefetch in parallel with the navigation transition as a fallback (B).
 */
export function NotificationsBridge() {
  const router = useRouter();
  const { state } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (state === 'authenticated' && !registered.current) {
      registered.current = true;
      registerForPushNotifications({ prompt: false });
    }
    if (state === 'unauthenticated') registered.current = false;
  }, [state]);

  // A) Warm the cache the moment a notification arrives (foreground always; background
  //    best-effort when the OS wakes the app via _contentAvailable / data message).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const threadId = threadIdOf(notification);
      if (threadId) {
        Sentry.addBreadcrumb({ category: 'push', message: 'notification received (prefetch)', data: { threadId } });
        prefetchThread(threadId);
      }
    });
    return () => sub.remove();
  }, []);

  // B) On tap, prefetch in parallel with the navigation animation, then deep-link.
  useEffect(() => {
    let mounted = true;
    const redirect = (notification: Notifications.Notification | undefined | null, source: 'cold' | 'warm') => {
      const data = notification?.request?.content?.data as NotifData | undefined;
      const threadId = data?.threadId ?? null;
      const url = data?.url ?? (threadId ? `/reading/${threadId}` : null);
      Sentry.addBreadcrumb({ category: 'push', message: `notification tapped (${source})`, data: { url: url ?? undefined, threadId: threadId ?? undefined } });
      // Kick the fetch first (non-blocking) so it overlaps the screen transition.
      if (threadId) prefetchThread(threadId);
      if (url) router.push(url as never);
    };

    // Cold start: app opened by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (mounted && response?.notification) redirect(response.notification, 'cold');
    });
    // Warm: tapped while the app was running/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification, 'warm');
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);

  return null;
}
