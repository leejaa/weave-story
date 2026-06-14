import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
      {/* 글자수 추정 페이지네이션이 살짝 넘쳐도 잘리지 않도록 본문은 세로 스크롤 가능.
          가로 페이지 넘김(부모 FlatList)과 축이 달라 제스처 충돌 없음. */}
      <ScrollView
        style={styles.prose}
        contentContainerStyle={styles.proseContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}>
        {isFirst && chapterTitle ? (
          <Text allowFontScaling={false} style={[styles.chapterTitle, { color: c.inkSoft }]}>{chapterTitle}</Text>
        ) : null}
        {paragraphs.map((p, i) => (
          <Text allowFontScaling={false} key={i} style={[styles.body, { color: c.ink }]}>
            {p}
          </Text>
        ))}
      </ScrollView>

      <Text allowFontScaling={false} style={[styles.pageNum, { color: c.inkFaint }]}>
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
  },
  proseContent: {
    flexGrow: 1,
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
