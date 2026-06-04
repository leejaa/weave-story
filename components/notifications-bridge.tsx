import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/client/context';
import { registerForPushNotifications } from '@/lib/notifications';

type NotifData = { url?: string; threadId?: string };

/**
 * Wires push notifications into the app tree:
 * - silently (re)registers the device token once the user is authenticated
 *   (no permission prompt — that happens contextually on the generating screen),
 * - deep-links to the story when a notification is tapped (warm or cold start).
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

  useEffect(() => {
    let mounted = true;
    const redirect = (notification: Notifications.Notification | undefined | null) => {
      const data = notification?.request?.content?.data as NotifData | undefined;
      const url = data?.url ?? (data?.threadId ? `/reading/${data.threadId}` : null);
      if (url) router.push(url as never);
    };

    // Cold start: app opened by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (mounted && response?.notification) redirect(response.notification);
    });
    // Warm: tapped while the app was running/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);

  return null;
}
