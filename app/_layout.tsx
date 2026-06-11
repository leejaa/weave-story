import '@/global.css';
import '@/lib/i18n';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/lib/auth/client/context';
import { PurchasesProviderWrapper } from '@/lib/purchases/provider-wrapper';
import { NotificationsBridge } from '@/components/notifications-bridge';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from '@/lib/query-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';

import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { BlackHanSans_400Regular } from '@expo-google-fonts/black-han-sans';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { useFonts } from 'expo-font';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { palette } from '@/constants/colors';
import { loadSavedLocale } from '@/hooks/use-locale';
import { initAnalytics } from '@/lib/analytics';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = palette[colorScheme === 'dark' ? 'dark' : 'light'];
  const [localeReady, setLocaleReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    BlackHanSans_400Regular,
    Jua_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    DMMono_400Regular,
  });

  useEffect(() => {
    void initAnalytics();
    loadSavedLocale().finally(() => setLocaleReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && localeReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, localeReady]);

  if ((!fontsLoaded && !fontError) || !localeReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
    <AuthProvider>
    <PurchasesProviderWrapper>
      <NotificationsBridge />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.paper },
        }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 카드 확대 전환용 별도 모달 스택 — animation:'none'으로 expand overlay가 전환 역할을 담당 */}
        <Stack.Screen name="(modal)" options={{ headerShown: false, presentation: 'modal', animation: 'none' }} />
        <Stack.Screen name="reading/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="reading-choice/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="setup" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="refine" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      <SystemBars
        style={{
          statusBar: colorScheme === 'dark' ? 'light' : 'dark',
          navigationBar: colorScheme === 'dark' ? 'light' : 'dark',
        }}
      />
    </PurchasesProviderWrapper>
    </AuthProvider>
    </PersistQueryClientProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
