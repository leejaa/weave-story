import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import type { SampleCardData } from '@/lib/api/types';
import type { BookPreviewLayout } from './book-preview-layout';
import { OpenBookCoverImage } from './open-book-cover-image';
import { OpenBookPageText } from './open-book-page-text';

type Props = {
  card: SampleCardData;
  layout: BookPreviewLayout;
  onClose: () => void;
  onStart: () => void;
};

export function BookPreviewPage({
  card,
  layout,
  onClose,
  onStart,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onStart} />

      <Pressable
        onPress={onClose}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.close')}
        style={[styles.closeButton, { top: layout.closeTop }]}
      >
        <Icon name="close" size={20} color="rgba(255,248,232,0.88)" />
      </Pressable>

      <Pressable style={[styles.leftPage, layout.leftPage]} pointerEvents="none">
        <OpenBookPageText card={card} />
      </Pressable>

      <View style={[styles.rightPage, layout.rightPage]}>
        <OpenBookCoverImage card={card} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    right: 22,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,16,10,0.34)',
  },
  leftPage: {
    position: 'absolute',
  },
  rightPage: {
    position: 'absolute',
    gap: 14,
  },
});
