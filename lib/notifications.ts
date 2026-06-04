import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { postRegisterPushToken } from '@/lib/api/fetch';

// Show the notification (banner + in the tray) even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

/**
 * Ensure the device's Expo push token is registered with the server.
 * `prompt: false` skips registration entirely if permission isn't already
 * granted (used on launch); `prompt: true` asks for permission (used at the
 * contextual moment when a chapter starts generating).
 */
export async function registerForPushNotifications({ prompt }: { prompt: boolean }): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Story updates',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      if (!prompt) return;
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return;

    const projectId = getProjectId();
    if (!projectId) {
      console.warn('[push] missing projectId — cannot get token');
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await postRegisterPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch (err) {
    console.warn('[push] register failed', err);
  }
}
