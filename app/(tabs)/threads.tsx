import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Thread = {
  id: string;
  title: string;
  coverColor: string;
  genre: string;
  chapter: number;
  progress: number;
  excerpt: string;
  finished: boolean;
};

const DUMMY_THREADS: Thread[] = [
  {
    id: 'lemon',
    title: 'The Lemonpolish Door',
    coverColor: '#6e8aa8',
    genre: 'Folk',
    chapter: 6,
    progress: 0.62,
    excerpt: '"She opened the door and the corridor exhaled — "',
    finished: false,
  },
  {
    id: 'river',
    title: 'Where the river forgets',
    coverColor: '#2f3a52',
    genre: 'Drama',
    chapter: 3,
    progress: 0.24,
    excerpt: '"The water remembered what the town had chosen to forget."',
    finished: false,
  },
  {
    id: 'bones',
    title: 'Small bones, large hands',
    coverColor: '#8a9270',
    genre: 'Folk',
    chapter: 7,
    progress: 1,
    excerpt: '"In the end she carried every one of them home."',
    finished: true,
  },
  {
    id: 'cliff',
    title: 'A stranger at the cliff house',
    coverColor: '#4a5d6c',
    genre: 'Mystery',
    chapter: 14,
    progress: 1,
    excerpt: '"The stranger had known all along. That was the worst part."',
    finished: true,
  },
];

export default function ThreadsScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ongoing = DUMMY_THREADS.filter(t => !t.finished);
  const finished = DUMMY_THREADS.filter(t => t.finished);

  const openThread = (id: string) => router.push(`/reading/${id}`);

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <Text style={[styles.screenTitle, { color: c.ink }]}>내 이야기</Text>

      {ongoing.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>진행 중</Text>
          {ongoing.map(thread => (
            <ThreadRow key={thread.id} thread={thread} onPress={() => openThread(thread.id)} />
          ))}
        </View>
      )}

      {finished.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>완결</Text>
          {finished.map(thread => (
            <ThreadRow key={thread.id} thread={thread} onPress={() => openThread(thread.id)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ThreadRow({ thread, onPress }: { thread: Thread; onPress: () => void }) {
  const c = usePalette();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.paperRaised, shadowColor: c.ink },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: thread.coverColor }]} />
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={[styles.genre, { color: c.inkFaint }]}>{thread.genre}</Text>
          {!thread.finished && (
            <Text style={[styles.chapterTag, { color: c.inkFaint }]}>Ch.{thread.chapter}</Text>
          )}
          {thread.finished && (
            <Text style={[styles.finishedTag, { color: c.thread }]}>완결</Text>
          )}
        </View>
        <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>{thread.title}</Text>
        <Text style={[styles.excerpt, { color: c.inkSoft }]} numberOfLines={1}>{thread.excerpt}</Text>
        {!thread.finished && (
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: c.rule }]}>
              <View style={[styles.progressFill, { width: `${thread.progress * 100}%`, backgroundColor: c.thread }]} />
            </View>
            <Text style={[styles.progressLabel, { color: c.inkFaint }]}>{Math.round(thread.progress * 100)}%</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 0 },
  screenTitle: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    marginBottom: 24,
  },
  section: { gap: 10, marginBottom: 32 },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cover: {
    width: 56,
    aspectRatio: 3 / 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  body: { flex: 1, justifyContent: 'space-between' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genre: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  chapterTag: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  finishedTag: { fontFamily: FONTS.sansMedium, fontSize: 10, letterSpacing: 0.5 },
  title: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.md, marginTop: 2 },
  excerpt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    marginTop: 3,
    lineHeight: 18,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1 },
  progressLabel: { fontFamily: FONTS.mono, fontSize: 10 },
});
