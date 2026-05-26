import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FONTS, SIZES } from '@/constants/colors';
import { useAuth } from '@/lib/auth/client/context';
import { usePalette } from '@/hooks/use-palette';
import { FloatingParticles } from '@/components/login/floating-particles';

export default function LoginScreen() {
  const { state, signInWithApple, signInWithGoogle } = useAuth();
  const c = usePalette();
  const insets = useSafeAreaInsets();

  if (state === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: c.paper }]}>
        <ActivityIndicator color={c.thread} />
      </View>
    );
  }

  if (state === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.paper,
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + 40,
        },
      ]}>

      <FloatingParticles />

      <View style={styles.brand}>
        <View style={[styles.diamond, { backgroundColor: c.thread }]} />
        <Text style={[styles.wordmark, { color: c.inkFaint }]}>WEAVE STORY</Text>
      </View>

      <View style={styles.headline}>
        <Text style={[styles.title, { color: c.ink }]}>Weave Story</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>
          Your stories, woven together.
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10}
            style={styles.authButton}
            onPress={signInWithApple}
          />
        )}
        <Pressable
          onPress={signInWithGoogle}
          style={[styles.googleButton, { borderColor: c.ruleStrong, backgroundColor: c.paperRaised }]}>
          <View style={styles.googleInner}>
            <Ionicons name="logo-google" size={16} color={c.inkSoft} />
            <Text style={[styles.googleLabel, { color: c.ink }]}>Continue with Google</Text>
          </View>
        </Pressable>

        <Text style={[styles.legal, { color: c.inkFaint }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 64,
  },
  diamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
  },
  wordmark: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 4,
  },
  headline: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    textAlign: 'center',
    lineHeight: SIZES.md * 1.8,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  authButton: {
    height: 52,
    width: '100%',
  },
  googleButton: {
    height: 52,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.md,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  legal: {
    fontFamily: FONTS.sans,
    fontSize: SIZES['2xs'],
    textAlign: 'center',
    lineHeight: SIZES['2xs'] * 1.7,
    marginTop: 4,
    paddingHorizontal: 16,
  },
});
