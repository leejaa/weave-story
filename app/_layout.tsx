import '@/global.css';
import '@/lib/i18n';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { palette } from '@/constants/colors';
import { loadSavedLocale } from '@/hooks/use-locale';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = palette[colorScheme === 'dark' ? 'dark' : 'light'];
  const [localeReady, setLocaleReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
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
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.paper },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reading/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
