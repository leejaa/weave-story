import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { FONTS } from '@/constants/colors';

const TAB_DEFS: { name: string; labelKey: string; icon: IconName }[] = [
  { name: 'index', labelKey: 'nav.today', icon: 'home' },
  { name: 'threads', labelKey: 'nav.threads', icon: 'library' },
  { name: 'you', labelKey: 'nav.you', icon: 'user' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 10) + 10,
          backgroundColor: `${c.paper}e0`,
          borderColor: c.rule,
          shadowColor: c.ink,
        },
      ]}>
      {TAB_DEFS.map((tab, index) => {
        const route = state.routes[index];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route?.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <Pressable key={tab.name} onPress={onPress} style={styles.tab}>
            <Icon
              name={tab.icon}
              size={22}
              color={isFocused ? c.thread : c.inkFaint}
              filled={isFocused}
            />
            <Text style={[styles.label, { color: isFocused ? c.thread : c.inkFaint }]}>
              {t(tab.labelKey as any)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    paddingBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 10,
  },
  label: {
    fontFamily: FONTS.sansMedium,
    fontSize: 11,
  },
});
