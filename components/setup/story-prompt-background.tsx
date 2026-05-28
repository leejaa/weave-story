import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

const STORY_PROMPT_DESK = require('@/assets/images/setup/story-prompt-paper-centered.png');

export function StoryPromptBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={STORY_PROMPT_DESK} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.warmWash} pointerEvents="none" />
      <View style={styles.readabilityWash} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  warmWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,248,232,0.06)',
  },
  readabilityWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(255,250,239,0.26)',
  },
});
