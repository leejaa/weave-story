import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryCard } from '@/components/story-card';
import { Chip } from '@/components/ui/chip';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type LibraryTab = 'reading' | 'finished' | 'saved' | 'archived';

const COVERS = {
  lemon: '#6e8aa8',
  river: '#2f3a52',
  bones: '#8a9270',
  cliff: '#4a5d6c',
  velvet: '#5b3a52',
};

const STORIES = [
  { id: 'lemon', cover: COVERS.lemon, title: 'The Lemonpolish Door', mood: 'Mystery', chapters: 9, progress: 0.62 },
  { id: 'river', cover: COVERS.river, title: 'Where the river forgets', mood: 'Drama', chapters: 12, progress: 0.24 },
  { id: 'cliff', cover: COVERS.cliff, title: 'A stranger at the cliff house', mood: 'Mystery', chapters: 14, progress: 0.07 },
  { id: 'velvet', cover: COVERS.velvet, title: 'Velvet hour', mood: 'Romance', chapters: 9, progress: 0.55 },
  { id: 'bones', cover: COVERS.bones, title: 'Small bones, large hands', mood: 'Folk', chapters: 7, progress: 1 },
  { id: 'lemon2', cover: COVERS.lemon, title: 'The clockwinder', mood: 'Folk', chapters: 11, progress: 0.40 },
];

const TAB_KEYS: LibraryTab[] = ['reading', 'finished', 'saved', 'archived'];

export default function LibraryScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('library');
  const [activeTab, setActiveTab] = useState<LibraryTab>('reading');

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>
          {t('stat', { threads: 24, unfinished: 6 })}
        </Text>
      </View>

      <View style={styles.tabs}>
        {TAB_KEYS.map(key => (
          <Chip key={key} on={activeTab === key} onPress={() => setActiveTab(key)}>
            {t(`tabs.${key}`)}
          </Chip>
        ))}
      </View>

      <View style={styles.grid}>
        {STORIES.map(s => (
          <View key={s.id} style={styles.gridCell}>
            <StoryCard
              title={s.title}
              mood={s.mood}
              chapters={s.chapters}
              progress={s.progress}
              coverColor={s.cover}
              onPress={() => router.push(`/reading/${s.id}`)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 0 },
  header: { marginBottom: 16, gap: 4 },
  title: { fontFamily: FONTS.serifSemibold, fontSize: SIZES['3xl'], letterSpacing: -0.4 },
  subtitle: { fontFamily: FONTS.serifItalic, fontSize: SIZES.sm, lineHeight: 20 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { width: '47.5%' },
});
