import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';
import type { ReportReason } from '@/lib/api/fetch';

const REASONS: ReportReason[] = ['sexual', 'violence', 'hate', 'illegal', 'other'];

type Props = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
};

export function ReportSheet({ visible, submitting, onClose, onSubmit }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('reading');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose} />
      <View style={[styles.sheet, { backgroundColor: c.paper, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.handle, { backgroundColor: c.rule }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
            {t('report.title')}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={t('common:a11y.close', 'Close')}>
            <Icon name="close" size={20} color={c.inkFaint} />
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
          {t('report.subtitle')}
        </Text>

        <View style={styles.reasons}>
          {REASONS.map(reason => (
            <Pressable
              key={reason}
              onPress={() => onSubmit(reason)}
              disabled={submitting}
              style={[styles.reasonRow, { borderColor: c.rule }]}>
              <Text style={[styles.reasonText, { color: c.ink, fontFamily: FONTS.sans }]}>
                {t(`report.reasons.${reason}`)}
              </Text>
              <Icon name="chevron-right" size={16} color={c.inkFaint} />
            </Pressable>
          ))}
        </View>

        {submitting ? (
          <ActivityIndicator color={c.thread} style={styles.spinner} />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  title: { fontSize: SIZES.xl },
  subtitle: { fontSize: SIZES.sm, marginTop: 2, marginBottom: 16 },
  reasons: { gap: 8 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  reasonText: { fontSize: SIZES.md },
  spinner: { marginTop: 16 },
});
