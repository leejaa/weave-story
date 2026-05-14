import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { SampleCardStack } from '@/components/home/sample-card-stack';
import { FONTS, SIZES } from '@/constants/colors';

export default function CreateScreen() {
  const c = usePalette();
  const router = useRouter();
  const { t } = useTranslation('home');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.paper }]}>
      <View style={styles.inner}>

        {/* 텍스트 + 버튼 — 고정 높이, 상단 */}
        <View style={styles.top}>
          <Text style={[styles.headline, { color: c.ink }]} allowFontScaling={false}>
            {t('hero.headline')}
          </Text>
          <Pressable
            onPress={() => router.push('/setup')}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: c.thread },
              pressed && styles.ctaPressed,
            ]}>
            <Text style={[styles.ctaLabel, { color: c.paper }]} allowFontScaling={false}>
              {t('hero.cta')}
            </Text>
            <Icon name="chevron-right" size={18} color={c.paper} />
          </Pressable>
        </View>

        {/* 카드 스택 — 나머지 공간 전부 */}
        <View style={styles.stackSection}>
          <SampleCardStack />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  top: {
    paddingTop: 8,
    gap: 16,
  },
  headline: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['2xl'],
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  cta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
    letterSpacing: 0.2,
  },
  stackSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
