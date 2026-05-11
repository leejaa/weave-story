import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryCard } from '@/components/story-card';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

const COVERS = {
  lemon: '#6e8aa8',
  river: '#2f3a52',
  bones: '#8a9270',
  cliff: '#4a5d6c',
  velvet: '#5b3a52',
};

type Period = 'morning' | 'afternoon' | 'evening';

function getDayPeriod(): { weekday: string; period: Period } {
  const h = new Date().getHours();
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const period: Period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return { weekday, period };
}

export default function TodayScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');

  const { weekday, period } = getDayPeriod();
  const openStory = (id: string) => router.push(`/reading/${id}`);

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      {/* Greeting */}
      <View style={styles.section}>
        <Text style={[styles.eyebrow, { color: c.inkFaint }]}>
          {weekday} · {t(`period.${period}`)}
        </Text>
        <Text style={[styles.greeting, { color: c.ink }]}>{t(`greeting.${period}`)}</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>{t('lastThread')}</Text>
      </View>

      {/* Continue card */}
      <View style={styles.section}>
        <Pressable
          onPress={() => openStory('lemon')}
          style={({ pressed }) => [
            styles.continueCard,
            { backgroundColor: c.paperRaised, shadowColor: c.ink },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.continueCover, { backgroundColor: COVERS.lemon }]}>
            <View style={styles.continueScrim} />
          </View>
          <View style={styles.continueBody}>
            <View>
              <Text style={[styles.mono, { color: c.inkFaint }]}>
                {t('chapter', { chapter: '06', beat: '04' })}
              </Text>
              <Text style={[styles.continueTitle, { color: c.ink }]}>The Lemonpolish Door</Text>
              <Text style={[styles.continueExcerpt, { color: c.inkSoft }]}>
                "She opened the door and the corridor exhaled — "
              </Text>
            </View>
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: c.rule, flex: 1 }]}>
                <View style={[styles.progressFill, { width: '62%', backgroundColor: c.thread }]} />
              </View>
              <Text style={[styles.mono, { color: c.inkFaint }]}>{t('progress', { percent: 62 })}</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Woven for tonight */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>{t('woven')}</Text>
          <Text style={[styles.seeAll, { color: c.thread }]}>{t('seeAll')}</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.gridCell}>
            <StoryCard
              title="Where the river forgets"
              mood="Drama"
              chapters={12}
              progress={0.24}
              coverColor={COVERS.river}
              onPress={() => openStory('river')}
            />
          </View>
          <View style={styles.gridCell}>
            <StoryCard
              title="Small bones, large hands"
              mood="Folk"
              chapters={7}
              progress={1}
              coverColor={COVERS.bones}
              onPress={() => openStory('bones')}
            />
          </View>
        </View>
      </View>

      {/* Slow burns */}
      <View>
        <Text style={[styles.sectionTitle, { color: c.ink, paddingHorizontal: 20, marginBottom: 12 }]}>
          {t('slowBurns')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}>
          {[
            { id: 'cliff', cover: COVERS.cliff, title: 'A stranger at the cliff house', mood: 'Mystery', chapters: 14 },
            { id: 'velvet', cover: COVERS.velvet, title: 'Velvet hour', mood: 'Romance', chapters: 9 },
            { id: 'lemon2', cover: COVERS.lemon, title: 'The clockwinder', mood: 'Folk', chapters: 11 },
          ].map(s => (
            <View key={s.id} style={styles.horizontalCard}>
              <StoryCard
                title={s.title}
                mood={s.mood}
                chapters={s.chapters}
                progress={0}
                coverColor={s.cover}
                onPress={() => openStory(s.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 0 },
  section: { padding: 20, paddingBottom: 8 },
  eyebrow: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES['2xs'],
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    letterSpacing: -0.4,
    lineHeight: 38,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    marginTop: 6,
    lineHeight: 24,
  },
  continueCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  continueCover: {
    width: 78,
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  continueScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  continueBody: { flex: 1, justifyContent: 'space-between' },
  mono: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  continueTitle: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.lg,
    marginTop: 2,
    lineHeight: 22,
  },
  continueExcerpt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.xl },
  seeAll: { fontFamily: FONTS.sans, fontSize: SIZES.xs },
  grid: { flexDirection: 'row', gap: 12 },
  gridCell: { flex: 1 },
  horizontalScroll: { gap: 12, paddingHorizontal: 20, paddingBottom: 6 },
  horizontalCard: { width: 130 },
});
