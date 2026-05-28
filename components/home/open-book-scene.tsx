import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

const OPEN_BOOK_SCENE = require('@/assets/images/home/open-book-scene.png');

export function OpenBookScene() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={OPEN_BOOK_SCENE} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.sceneShade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});
