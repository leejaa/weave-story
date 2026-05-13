import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { useThreads } from '@/hooks/use-threads';
import { ThreadRow } from '@/components/thread-row';
import { FONTS, SIZES } from '@/constants/colors';

export default function ThreadsScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('library');
  const { data: threads = [], isLoading } = useThreads();

  const ready = threads.filter(t => t.title !== null);
  const ongoing = ready.filter(t => t.status !== 'completed');
  const finished = ready.filter(t => t.status === 'completed');

  const openThread = (threadId: string) => router.push(`/reading/${threadId}`);

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <Text style={[styles.screenTitle, { color: c.ink }]}>{t('screenTitle')}</Text>

      {isLoading ? (
        <ActivityIndicator color={c.thread} style={{ marginTop: 24 }} />
      ) : threads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.inkSoft }]}>{t('empty.threads.title')}</Text>
          <Text style={[styles.emptySubtitle, { color: c.inkFaint }]}>{t('empty.threads.subtitle')}</Text>
        </View>
      ) : (
        <>
          {ongoing.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>{t('section.ongoing')}</Text>
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
              <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>{t('section.completed')}</Text>
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
