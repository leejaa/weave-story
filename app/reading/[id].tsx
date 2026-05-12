import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { ChoiceTile } from '@/components/choice-tile';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

const PAPER_SCRIM = [0, 0.05, 0.20, 0.50, 0.82, 0.95, 1];

export default function ReadingScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const { data, loading, choosing, choose } = useThreadDetail(id);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const handleChoiceSelect = useCallback((index: number) => {
    setSelectedChoice(prev => (prev === index ? null : index));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!data?.chapter || selectedChoice === null) return;
    setSelectedChoice(null);
    const next = await choose(data.chapter.chapterNumber, selectedChoice);
    if (next) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [data, selectedChoice, choose]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.paper }]}>
        <ActivityIndicator color={c.thread} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.centered, { backgroundColor: c.paper }]}>
        <Text style={[styles.errorText, { color: c.inkSoft }]}>이야기를 찾을 수 없어요.</Text>
      </View>
    );
  }

  const { chapter, title, estimatedChapters, currentChapter } = data;
  const paragraphs = chapter?.content?.split(/\n\n+/).filter(Boolean) ?? [];
  const options = chapter?.options ?? null;
  const isCompleted = data.status === 'completed' || !chapter;

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <ChapterRibbon
        title={title}
        chapter={currentChapter}
        totalChapters={estimatedChapters}
        onBack={() => router.back()}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.prose,
          { paddingBottom: insets.bottom + (options ? 340 : 100) },
        ]}
        showsVerticalScrollIndicator={false}>

        {chapter?.imageUrl ? (
          <View style={styles.chapterImage}>
            <Image
              source={{ uri: chapter.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.imageScrim} />
          </View>
        ) : null}

        {chapter?.title ? (
          <Text style={[styles.chapterTitle, { color: c.inkSoft }]}>{chapter.title}</Text>
        ) : null}

        {paragraphs.map((p, i) => (
          <Text key={i} style={[styles.body, { color: c.ink }]}>{p}</Text>
        ))}

        {isCompleted && (
          <Text style={[styles.endMark, { color: c.inkFaint }]}>— 끝 —</Text>
        )}
      </ScrollView>

      {!isCompleted && options && options.length > 0 && (
        <View style={[styles.choiceTray, { bottom: 0 }]}>
          <View style={styles.gradientScrim} pointerEvents="none">
            {PAPER_SCRIM.map((opacity, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c.paper, opacity }} />
            ))}
          </View>
          <View style={[styles.trayBody, { backgroundColor: c.paper }]}>
            <Text style={[styles.prompt, { color: c.inkSoft }]}>
              어떻게 할까요?
            </Text>
            <View style={styles.choices}>
              {options.map(opt => (
                <ChoiceTile
                  key={opt.index}
                  marker={String.fromCharCode(65 + opt.index)}
                  text={opt.text}
                  selected={selectedChoice === opt.index}
                  faded={selectedChoice !== null && selectedChoice !== opt.index}
                  onPress={() => handleChoiceSelect(opt.index)}
                />
              ))}
            </View>

            {selectedChoice !== null && (
              <Pressable
                onPress={handleConfirm}
                disabled={choosing}
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: c.thread, opacity: pressed || choosing ? 0.8 : 1 },
                ]}>
                {choosing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>계속하기</Text>
                )}
              </Pressable>
            )}

            <View style={{ height: insets.bottom + 16 }} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: FONTS.serifItalic, fontSize: SIZES.lg },
  scroll: { flex: 1 },
  prose: { paddingHorizontal: 24, paddingTop: 20, gap: 0 },
  chapterImage: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#2d2d2d',
  },
  imageScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  chapterTitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  body: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 16,
  },
  endMark: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 2,
  },
  choiceTray: { position: 'absolute', left: 0, right: 0 },
  gradientScrim: { height: 56, flexDirection: 'column' },
  trayBody: { paddingHorizontal: 16, paddingTop: 8 },
  prompt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    textAlign: 'center',
    marginBottom: 10,
  },
  choices: { gap: 8 },
  confirmButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
