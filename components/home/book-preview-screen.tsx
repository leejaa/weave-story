import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { SampleCardData } from '@/lib/api/types';
import { BookPreviewPage } from './book-preview-page';
import { getBookPreviewLayout } from './book-preview-layout';
import { OpenBookScene } from './open-book-scene';

type Props = {
  card: SampleCardData;
  onClose: () => void;
  onStart: () => void;
};

export function BookPreviewScreen({ card, onClose, onStart }: Props) {
  const { width, height } = useWindowDimensions();
  const layout = getBookPreviewLayout({ width, height }, null);

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <OpenBookScene />
      <BookPreviewPage
        card={card}
        layout={layout}
        onClose={onClose}
        onStart={onStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(11,8,5,0.92)',
  },
});
