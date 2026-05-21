import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { useAuthStore } from '../../store';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isLoading } = useAuthStore();

  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    redirectUri: makeRedirectUri({ scheme: 'nazary-mobile' }),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      if (idToken) {
        googleLogin(idToken).catch((error: any) => {
          alert.show({ title: 'Google Sign-In Failed', message: error.message || 'Something went wrong.', type: 'error' });
        });
      }
    }
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    try {
      await promptGoogleAsync();
    } catch (error: any) {
      alert.show({ title: 'Google Sign-In', message: 'Could not open Google sign-in.', type: 'error' });
    }
  };

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const easingFn = Easing.out(Easing.cubic);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 700, easing: easingFn, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 700, easing: easingFn, useNativeDriver: true }),
      ]).start();
    }, 150);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch (error: any) {
      alert.show({ title: 'Login Failed', message: error.message || 'Invalid email or password.', type: 'error' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAwareScroll
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} accessibilityRole="button">
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.outline} />
                </Pressable>
              </View>

              <Pressable style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <Pressable onPress={handleLogin} disabled={isLoading}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
            <View style={styles.socialContainer}>
              <Pressable style={[styles.socialButton, { opacity: 0.5 }]} disabled accessibilityLabel="Apple sign-in coming soon" accessibilityRole="button">
                <Ionicons name="logo-apple" size={20} color={colors.onSurface} />
                <Text style={styles.socialText}>Apple</Text>
                <Text style={styles.comingSoonLabel}>Soon</Text>
              </Pressable>
              <Pressable style={styles.socialButton} onPress={handleGoogleLogin} disabled={isLoading} accessibilityLabel="Sign in with Google" accessibilityRole="button">
                <Ionicons name="logo-google" size={20} color={colors.onSurface} />
                <Text style={styles.socialText}>Google</Text>
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAwareScroll>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: 'Manrope_300Light',
    fontSize: 32,
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing['2xl'],
  },
  form: { gap: spacing.md, marginBottom: spacing.xl },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  inputIcon: { marginRight: spacing.md },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface },
  forgotButton: { alignSelf: 'flex-end' },
  forgotText: { ...typography.labelMd, color: colors.primary },
  loginButton: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginButtonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.lg },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.outlineVariant },
  dividerText: { ...typography.labelMd, color: colors.outline, textTransform: 'uppercase' },
  socialContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  comingSoonLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: colors.outline, position: 'absolute', bottom: 8, letterSpacing: 0.3 },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  signupLink: { ...typography.bodyMd, color: colors.primary, fontFamily: 'Inter_400Regular' },
});
