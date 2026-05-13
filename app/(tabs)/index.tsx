import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

export default function CreateScreen() {
  const c = usePalette();
  const router = useRouter();
  const { t } = useTranslation('home');

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.paper },
      ]}>

      <View style={styles.center}>
        <Icon name="sparkle" size={32} color={c.thread} filled />
        <Text style={[styles.headline, { color: c.ink }]}>{t('hero.headline')}</Text>
        <Text style={[styles.body, { color: c.inkSoft }]}>{t('hero.body')}</Text>
        <Pressable
          onPress={() => router.push('/setup')}
          style={[styles.cta, { backgroundColor: c.thread }]}>
          <Text style={[styles.ctaLabel, { color: c.paper }]}>{t('hero.cta')}</Text>
          <Icon name="chevron-right" size={18} color={c.paper} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  headline: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['4xl'],
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  body: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  cta: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
    letterSpacing: 0.2,
  },
});
