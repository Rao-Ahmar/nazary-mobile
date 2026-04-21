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
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { useAuthStore } from '../../store';
import { RolePicker } from '../../components';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import type { AuthStackParamList, UserRole } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const { signup, isLoading } = useAuthStore();

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

  const handleSignup = async () => {
    if (!name || !email || !password || !role) return;
    try {
      await signup(name, email, password, role);
    } catch (error: any) {
      alert.show({ title: 'Signup Failed', message: error.message || 'Could not create account. Please try again.', type: 'error' });
    }
  };

  const isFormValid = name.length > 0 && email.length > 0 && password.length > 0 && role !== null;

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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your journey with nazary</Text>

            {/* Role Picker */}
            <Text style={styles.sectionLabel}>I am a...</Text>
            <RolePicker selected={role} onSelect={setRole} />

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={colors.outline}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

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

              <Pressable onPress={handleSignup} disabled={isLoading || !isFormValid}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.signupButton, (!isFormValid || isLoading) && { opacity: 0.5 }]}
                >
                  <Text style={styles.signupButtonText}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  sectionLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  form: { gap: spacing.md, marginTop: spacing['2xl'], marginBottom: spacing.xl },
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
  signupButton: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  signupButtonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  loginLink: { ...typography.bodyMd, color: colors.primary, fontFamily: 'Inter_400Regular' },
});
