import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { SampleCardData } from '@/lib/api/types';

type Props = {
  card: SampleCardData;
};

export function OpenBookCoverImage({ card }: Props) {
  if (!card.imageUrl) return null;

  return (
    <View style={styles.frame}>
      <Image source={{ uri: card.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 0.78,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: 'rgba(91,70,42,0.12)',
    shadowColor: '#4a321c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
});
