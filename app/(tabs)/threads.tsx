import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '@/hooks/use-palette';
import { useThreads } from '@/hooks/use-threads';
import { ThreadRow } from '@/components/thread-row';
import { FONTS, SIZES } from '@/constants/colors';

export default function ThreadsScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { threads, loading } = useThreads();

  const ongoing = threads.filter(t => t.status !== 'completed');
  const finished = threads.filter(t => t.status === 'completed');

  const openThread = (threadId: string) => router.push(`/reading/${threadId}`);

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <Text style={[styles.screenTitle, { color: c.ink }]}>내 이야기</Text>

      {loading ? (
        <ActivityIndicator color={c.thread} style={{ marginTop: 24 }} />
      ) : threads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.inkSoft }]}>아직 읽은 이야기가 없어요</Text>
          <Text style={[styles.emptySubtitle, { color: c.inkFaint }]}>홈에서 이야기를 골라 시작해보세요</Text>
        </View>
      ) : (
        <>
          {ongoing.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>진행 중</Text>
              {ongoing.map(thread => (
                <ThreadRow
                  key={thread.threadId}
                  thread={thread}
                  onPress={() => openThread(thread.threadId)}
                />
              ))}
            </View>
          )}

          {finished.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>완결</Text>
              {finished.map(thread => (
                <ThreadRow
                  key={thread.threadId}
                  thread={thread}
                  onPress={() => openThread(thread.threadId)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  empty: { marginTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.lg },
  emptySubtitle: { fontFamily: FONTS.serifItalic, fontSize: SIZES.sm },
});
