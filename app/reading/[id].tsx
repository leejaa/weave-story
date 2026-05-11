import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { ChoiceTile } from '@/components/choice-tile';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

const CHOICES = [
  { marker: 'A', text: 'Step into the corridor, even though the clock has stopped.' },
  { marker: 'B', text: 'Close the door. Whatever lives there can keep counting alone.' },
  { marker: 'C', text: 'Call her name once, softly.' },
];

export default function ReadingScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('reading');
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <ChapterRibbon
        title="The Lemonpolish Door"
        chapter={6}
        beat={4}
        totalBeats={9}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.prose, { paddingBottom: insets.bottom + 320 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.chapterLabel, { color: c.inkSoft }]}>
          {t('chapterLabel', { number: 6 })}
        </Text>
        <Text style={[styles.body, { color: c.ink }]}>
          She opened the door and the corridor exhaled — a thin breath of dust and lemon polish.
          Somewhere above, a clock she had never wound continued, faithfully, to count.
        </Text>
        <Text style={[styles.body, { color: c.ink }]}>
          The hall ran longer than the house had any right to. At its end, a single brass handle
          gleamed where no light ought to reach it. She stood very still and listened for the
          second sound she half-remembered hearing on the way up the stairs.
        </Text>
        <Text style={[styles.body, { color: c.ink }]}>
          Nothing came. Only the steady accounting from above, and her own heart, keeping a
          different time entirely.
        </Text>
      </ScrollView>

      {/* Choice tray */}
      <View style={[styles.choiceTray, { bottom: 0 }]}>
        <View style={[styles.trayBody, { backgroundColor: c.paper }]}>
          <Text style={[styles.prompt, { color: c.inkSoft }]}>{t('prompt')}</Text>
          <View style={styles.choices}>
            {CHOICES.map(choice => (
              <ChoiceTile
                key={choice.marker}
                marker={choice.marker}
                text={choice.text}
                selected={selectedChoice === choice.marker}
                faded={selectedChoice !== null && selectedChoice !== choice.marker}
                onPress={() => setSelectedChoice(choice.marker)}
              />
            ))}
          </View>
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  prose: { paddingHorizontal: 24, paddingTop: 20, maxWidth: 640 },
  chapterLabel: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  body: { fontFamily: FONTS.serif, fontSize: 18, lineHeight: 30, marginBottom: 16 },
  choiceTray: { position: 'absolute', left: 0, right: 0 },
  trayBody: { paddingHorizontal: 16, paddingTop: 8 },
  prompt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    textAlign: 'center',
    marginBottom: 10,
  },
  choices: { gap: 8 },
});
