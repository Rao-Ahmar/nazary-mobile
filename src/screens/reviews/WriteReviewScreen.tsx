import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { StarRating } from '../../components/StarRating';
import { reviewsApi } from '../../api/reviews';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';

export function WriteReviewScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();
  const { type, targetId, targetName } = route.params;
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = rating > 0 && text.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (type === 'planner') {
        await reviewsApi.createPlannerReview({ plannerId: targetId, rating, text: text.trim() });
      } else if (type === 'place') {
        await reviewsApi.createPlaceReview(targetId, { rating, text: text.trim() });
      }
      alert.show({ title: 'Review Submitted', message: `Your ${rating}-star review for ${targetName} has been submitted!`, type: 'success', buttons: [
        { text: 'OK', onPress: () => navigation.goBack() },
      ] });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not submit review. Please try again.';
      alert.show({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Write Review</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAwareScroll contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <Text style={styles.targetName}>{targetName}</Text>
          <Text style={styles.label}>How would you rate your experience?</Text>

          <View style={styles.ratingContainer}>
            <StarRating rating={rating} size={36} interactive onRate={setRating} />
            {rating > 0 && <Text style={styles.ratingLabel}>{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</Text>}
          </View>

          <Text style={styles.label}>Tell us more</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Share your experience..."
              placeholderTextColor={colors.outline}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.charCount}>{text.length}/500</Text>
        </Animated.View>
      </KeyboardAwareScroll>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleSubmit} disabled={!canSubmit} style={styles.submitButton}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, !canSubmit && { opacity: 0.5 }]}
          >
            <Text style={styles.submitText}>Submit Review</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  targetName: { fontFamily: 'Manrope_300Light', fontSize: 28, color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing['2xl'] },
  label: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  ratingContainer: { alignItems: 'center', marginBottom: spacing['2xl'] },
  ratingLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary, marginTop: spacing.md },
  textInputContainer: { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.xl, padding: spacing.lg, minHeight: 150, marginBottom: spacing.sm },
  textInput: { ...typography.bodyMd, color: colors.onSurface, minHeight: 120 },
  charCount: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'right' },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  submitButton: { width: '100%' },
  gradient: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
});
