import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type Props = {
  topInset: number;
  onBack: () => void;
};

export function StoryPromptHeader({ topInset, onBack }: Props) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <Icon name="chevron-left" size={24} color="#463522" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(70,53,34,0.18)',
    backgroundColor: 'rgba(255,250,240,0.74)',
  },
});
