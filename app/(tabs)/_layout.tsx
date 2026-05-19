import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/lib/auth/client/context';
import { usePalette } from '@/hooks/use-palette';
import { FONTS } from '@/constants/colors';

export default function TabLayout() {
  const { state } = useAuth();
  const c = usePalette();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.thread,
        tabBarInactiveTintColor: c.inkFaint,
        tabBarStyle: {
          backgroundColor: c.paper,
          borderTopColor: c.rule,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 49 + insets.bottom,
          paddingBottom: insets.bottom,
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
