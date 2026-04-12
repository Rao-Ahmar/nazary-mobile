import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { coupleRequestsApi } from '../../api/coupleRequests';

export function CoupleRequestScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [partnerName, setPartnerName] = useState('');
  const [destinationPreference, setDestinationPreference] = useState('');
  const [travelDates, setTravelDates] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (!partnerName.trim() || !destinationPreference.trim() || !travelDates.trim() || !budgetRange.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await coupleRequestsApi.create({
        partner_name: partnerName.trim(),
        destination_preference: destinationPreference.trim(),
        travel_dates: travelDates.trim(),
        budget_range: budgetRange.trim(),
        special_requests: specialRequests.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="heart-circle" size={64} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            We have received your couple trip request. Our team will review it and get back to you with curated options.
          </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.successButton}
            >
              <Text style={styles.successButtonText}>Back to Home</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.headerTitle}>Couple Trip Request</Text>
            <View style={{ width: 44 }} />
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            {/* Description */}
            <View style={styles.descriptionCard}>
              <Ionicons name="heart" size={20} color={colors.heart} />
              <Text style={styles.descriptionText}>
                Plan a special trip for two. Share your preferences and our team will curate the perfect couple getaway.
              </Text>
            </View>

            {/* Partner Name */}
            <Text style={styles.label}>Partner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your travel partner's name"
              placeholderTextColor={colors.outline}
              value={partnerName}
              onChangeText={setPartnerName}
            />

            {/* Destination Preference */}
            <Text style={styles.label}>Destination Preference *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hunza, Skardu, Swat"
              placeholderTextColor={colors.outline}
              value={destinationPreference}
              onChangeText={setDestinationPreference}
            />

            {/* Travel Dates */}
            <Text style={styles.label}>Travel Dates *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. June 15 - June 20, 2026"
              placeholderTextColor={colors.outline}
              value={travelDates}
              onChangeText={setTravelDates}
            />

            {/* Budget Range */}
            <Text style={styles.label}>Budget Range *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PKR 50,000 - 80,000"
              placeholderTextColor={colors.outline}
              value={budgetRange}
              onChangeText={setBudgetRange}
            />

            {/* Special Requests */}
            <Text style={styles.label}>Special Requests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requirements, preferences, or surprises you'd like to plan..."
              placeholderTextColor={colors.outline}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Submit */}
            <Pressable onPress={handleSubmit} disabled={isSubmitting}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.submitText}>Submit Request</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    color: colors.onSurface,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.heartTint,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  descriptionText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  submitButton: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  submitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  successIconWrap: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 24,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  successSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  successButton: {
    height: 52,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  successButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
});
