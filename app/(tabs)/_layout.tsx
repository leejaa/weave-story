import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/lib/auth/client/context';
import { usePalette } from '@/hooks/use-palette';
import { useResumeReading } from '@/hooks/use-resume-reading';
import { FONTS } from '@/constants/colors';

export default function TabLayout() {
  const { state } = useAuth();
  const c = usePalette();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

  // 콜드 스타트 시 리더 상태로 종료된 기록이 있으면 그 스레드로 자동 이동(이어읽기).
  useResumeReading(state === 'authenticated');

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.paper }}>
        <ActivityIndicator color={c.thread} />
      </View>
    );
  }

  if (state === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  // Float the tab bar so screens render full-height behind it. The home tab
  // makes it transparent (the cinematic video shows through to the very bottom);
  // other tabs keep the opaque cream bar.
  const tabBarBase = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 49 + insets.bottom,
    paddingBottom: insets.bottom,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.thread,
        tabBarInactiveTintColor: c.inkFaint,
        tabBarStyle: {
          ...tabBarBase,
          backgroundColor: c.paper,
          borderTopColor: c.rule,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.sansMedium,
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.create'),
          tabBarStyle: { ...tabBarBase, backgroundColor: 'transparent', borderTopWidth: 0 },
          tabBarIcon: ({ color, focused }) => (
            <Icon name="feather" size={22} color={color} filled={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: t('nav.stories'),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="library" size={22} color={color} filled={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
