import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalette } from '@/hooks/use-palette';

/** StoryCard와 동일한 치수(커버 3:4 + 메타 행)의 로딩 스켈레톤. */
export function StoryCardSkeleton({ width }: { width: number }) {
  const c = usePalette();
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton width={width} height={(width * 4) / 3} radius={0} />
      <View style={[styles.meta, { backgroundColor: c.paperRaised }]}>
        <Skeleton width={'55%'} height={9} radius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, overflow: 'hidden' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
});
