import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { authApi } from '../../api/auth';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 150);
  }, []);

  const handleSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
            {!sent ? (
              <>
                <Ionicons name="lock-open-outline" size={48} color={colors.primary} style={{ marginBottom: spacing.xl }} />
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions.</Text>

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

                <Pressable onPress={handleSubmit} disabled={isLoading || !email}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.submitButton, (!email || isLoading) && { opacity: 0.5 }]}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} style={{ marginBottom: spacing.xl }} />
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                  We've sent password reset instructions to {email}
                </Text>
                <Pressable onPress={() => navigation.goBack()}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}
                  >
                    <Text style={styles.submitButtonText}>Back to Login</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: spacing['2xl'] },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLg, color: colors.onSurfaceVariant, marginBottom: spacing['2xl'] },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.lg, height: 56, marginBottom: spacing.xl },
  inputIcon: { marginRight: spacing.md },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface },
  submitButton: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
});
