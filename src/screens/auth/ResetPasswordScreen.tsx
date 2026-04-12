import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { authApi } from '../../api/auth';

export function ResetPasswordScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tokenFromRoute = route?.params?.token ?? '';

  const [token, setToken] = useState(tokenFromRoute);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Missing Token', 'Please enter the reset token from your email.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Could not reset password. The token may be invalid or expired.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) }] }}>
            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={colors.success} />
                </View>
                <Text style={styles.title}>Password Reset</Text>
                <Text style={styles.subtitle}>Your password has been reset successfully. You can now sign in with your new password.</Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Go to Sign In</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter the reset token from your email and choose a new password.</Text>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Reset Token"
                      placeholderTextColor={colors.outline}
                      value={token}
                      onChangeText={setToken}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      placeholderTextColor={colors.outline}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor={colors.outline}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>

                  <Pressable onPress={handleReset} disabled={isSubmitting}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryContainer]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.button, isSubmitting && { opacity: 0.6 }]}
                    >
                      <Text style={styles.buttonText}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: { gap: spacing.md },
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
  button: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  successContainer: { alignItems: 'center', paddingTop: spacing['2xl'] },
  successIcon: { marginBottom: spacing.xl },
});
