import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { TabBar } from '@/components/tab-bar';
import { useAuth } from '@/lib/auth/client/context';
import { usePalette } from '@/hooks/use-palette';

export default function TabLayout() {
  const { state } = useAuth();
  const c = usePalette();

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
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="threads" options={{ title: 'Stories' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
