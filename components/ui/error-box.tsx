import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import { isNetworkError } from '@/lib/api/errors';

type Props = {
  error: string;
  originalError?: unknown;
  onRetry?: () => void;
};

export function ErrorBox({ error, originalError, onRetry }: Props) {
  const c = usePalette();
  const { t } = useTranslation('common');
  const isNetwork = originalError !== undefined && isNetworkError(originalError);

  return (
    <View style={[styles.container, { backgroundColor: c.paperRaised, borderColor: '#fca5a5' }]}>
      <View style={styles.row}>
        <Icon name={isNetwork ? 'wifi-off' : 'alert'} size={18} color="#ef4444" filled />
        <Text style={[styles.message, { color: c.ink }]}>{error}</Text>
      </View>
      {onRetry && (
        <Pressable onPress={onRetry} style={[styles.retryBtn, { borderColor: c.rule }]}>
          <Icon name="refresh" size={14} color={c.inkSoft} />
          <Text style={[styles.retryLabel, { color: c.inkSoft }]}>{t('actions.retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  message: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  retryLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.xs,
  },
});
