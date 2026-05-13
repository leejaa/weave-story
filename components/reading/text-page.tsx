import { View, Text, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  content: string;
  chapterTitle?: string | null;
  pageIndex: number;
  totalPages: number;
};

export function TextPage({ content, chapterTitle, pageIndex, totalPages }: Props) {
  const c = usePalette();
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  const isFirst = pageIndex === 0;

  return (
    <View style={styles.page}>
      {isFirst && chapterTitle ? (
        <Text style={[styles.chapterTitle, { color: c.inkSoft }]}>{chapterTitle}</Text>
      ) : null}

      <View style={styles.prose}>
        {paragraphs.map((p, i) => (
          <Text key={i} style={[styles.body, { color: c.ink }]}>
            {p}
          </Text>
        ))}
      </View>

      <Text style={[styles.pageNum, { color: c.inkFaint }]}>
        {pageIndex + 1} / {totalPages}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  chapterTitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  prose: {
    flex: 1,
    overflow: 'hidden',
  },
  body: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    lineHeight: 30,
    marginBottom: 16,
  },
  pageNum: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 8,
  },
});
