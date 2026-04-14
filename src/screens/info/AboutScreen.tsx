import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { useAuthStore } from '../../store';
import { feedbackApi } from '../../api/feedback';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';

export function AboutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Success animation
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (submitted) {
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [submitted]);

  const validate = (): string | null => {
    if (!subject.trim()) return 'Subject is required';
    if (!message.trim()) return 'Message is required';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await feedbackApi.submit({
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to submit feedback. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setError('');
    checkScale.setValue(0);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 44 }} />
      </View>

        <KeyboardAwareScroll
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="compass" size={48} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Nazary</Text>
            <Text style={styles.tagline}>Explore Pakistan with trusted trip planners</Text>
          </View>

          {/* App Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Our Mission</Text>
            <Text style={styles.infoText}>
              Nazary connects travelers with verified trip planners across Pakistan. Whether you're
              looking for a weekend getaway to the northern mountains or a week-long adventure, we
              help you find trusted planners who know the terrain and culture.
            </Text>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Version</Text>
              <Text style={styles.versionValue}>1.0.0</Text>
            </View>
          </View>

          {/* Feedback Form */}
          <Text style={styles.sectionTitle}>Send Us Feedback</Text>
          <Text style={styles.sectionDesc}>
            Have a question, suggestion, or issue? We'd love to hear from you.
          </Text>

          {/* User info (read-only) */}
          <View style={styles.userInfoRow}>
            <Ionicons name="person-circle-outline" size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.userInfoText}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userInfoDot}>·</Text>
            <Text style={styles.userInfoText}>{user?.email ?? ''}</Text>
          </View>

          {submitted ? (
            <View style={styles.successCard}>
              <Animated.View style={[styles.successIcon, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
              </Animated.View>
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successText}>
                Your feedback has been submitted. We'll get back to you soon.
              </Text>
              <Pressable style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Send Another</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="What's this about?"
                placeholderTextColor={colors.outline}
              />

              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us more..."
                placeholderTextColor={colors.outline}
                multiline
                textAlignVertical="top"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </Pressable>
            </>
          )}
        </KeyboardAwareScroll>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
    scrollContent: { paddingHorizontal: spacing.xl },

    // Hero
    heroSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
    logoContainer: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    appName: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 28,
      color: colors.onSurface,
      marginBottom: spacing.xs,
    },
    tagline: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    // Info card
    infoCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing.xl,
      marginBottom: spacing['2xl'],
    },
    infoTitle: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 18,
      color: colors.onSurface,
      marginBottom: spacing.sm,
    },
    infoText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    versionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.surfaceContainerHigh,
      paddingTop: spacing.md,
    },
    versionLabel: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
    },
    versionValue: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: colors.onSurface,
    },

    // User info
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: radii.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
    },
    userInfoText: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
    },
    userInfoDot: {
      ...typography.bodySm,
      color: colors.outline,
    },

    // Form
    sectionTitle: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 20,
      color: colors.onSurface,
      marginBottom: spacing.xs,
    },
    sectionDesc: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.lg,
    },
    label: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.onSurfaceVariant,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: radii.md,
      paddingHorizontal: spacing.lg,
      height: 48,
      ...typography.bodyMd,
      color: colors.onSurface,
    },
    messageInput: {
      height: 120,
      paddingTop: spacing.md,
    },
    errorText: {
      ...typography.bodySm,
      color: colors.error,
      marginTop: spacing.sm,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radii.xl,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xl,
    },
    submitButtonText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: colors.onPrimary,
      letterSpacing: 0.3,
    },

    // Success
    successCard: {
      alignItems: 'center',
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing['2xl'],
    },
    successIcon: { marginBottom: spacing.lg },
    successTitle: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 22,
      color: colors.onSurface,
      marginBottom: spacing.sm,
    },
    successText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    resetButton: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: spacing.xl,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.primary,
    },
  });
