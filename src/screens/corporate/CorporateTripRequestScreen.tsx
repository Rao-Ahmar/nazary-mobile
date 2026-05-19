import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { corporateTripsApi } from '../../api/corporateTrips';
import { plannersApi } from '../../api/planners';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import type { Agency } from '../../types';

export function CorporateTripRequestScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();

  const [companyName, setCompanyName] = useState('');
  const [estimatedPeople, setEstimatedPeople] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [selectedPlannerId, setSelectedPlannerId] = useState<string | null>(null);
  const [selectedPlannerName, setSelectedPlannerName] = useState('No preference');
  const [showPlannerPicker, setShowPlannerPicker] = useState(false);
  const [planners, setPlanners] = useState<Agency[]>([]);
  const [plannersLoading, setPlannersLoading] = useState(false);

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

  useEffect(() => {
    setPlannersLoading(true);
    plannersApi.getAll()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setPlanners(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setPlannersLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      alert.show({ title: 'Missing Fields', message: 'Company name is required.', type: 'warning' });
      return;
    }
    const people = parseInt(estimatedPeople, 10);
    if (!people || people <= 0) {
      alert.show({ title: 'Missing Fields', message: 'Please enter a valid number of people.', type: 'warning' });
      return;
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      alert.show({ title: 'Missing Fields', message: 'Please provide at least one contact method (email or phone).', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await corporateTripsApi.create({
        company_name: companyName.trim(),
        estimated_people: people,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        special_notes: specialNotes.trim() || undefined,
        preferred_planner_id: selectedPlannerId || undefined,
      });
      setIsSuccess(true);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Something went wrong. Please try again.';
      alert.show({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="briefcase" size={64} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            We have received your corporate trip request. Our team will review it and get back to you with a tailored group travel plan.
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
      <KeyboardAwareScroll
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Corporate Trip Request</Text>
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
            <Ionicons name="briefcase" size={20} color={colors.primary} />
            <Text style={styles.descriptionText}>
              Plan a corporate group trip. Share your company details and preferences — our team will arrange the perfect outing.
            </Text>
          </View>

          {/* Company Name */}
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your company or organization name"
            placeholderTextColor={colors.outline}
            value={companyName}
            onChangeText={setCompanyName}
          />

          {/* Estimated People */}
          <Text style={styles.label}>Estimated People *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25"
            placeholderTextColor={colors.outline}
            value={estimatedPeople}
            onChangeText={setEstimatedPeople}
            keyboardType="number-pad"
          />

          {/* Contact Email */}
          <Text style={styles.label}>Contact Email</Text>
          <TextInput
            style={styles.input}
            placeholder="company@example.com"
            placeholderTextColor={colors.outline}
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Contact Phone */}
          <Text style={styles.label}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+923001234567"
            placeholderTextColor={colors.outline}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />

          {/* Preferred Planner */}
          <Text style={styles.label}>Preferred Planner</Text>
          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowPlannerPicker(!showPlannerPicker)}
          >
            <Text style={[styles.pickerText, !selectedPlannerId && { color: colors.outline }]}>
              {selectedPlannerName}
            </Text>
            <Ionicons name={showPlannerPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          {showPlannerPicker && (
            <View style={styles.plannerList}>
              <Pressable
                style={styles.plannerItem}
                onPress={() => {
                  setSelectedPlannerId(null);
                  setSelectedPlannerName('No preference');
                  setShowPlannerPicker(false);
                }}
              >
                <Text style={[styles.plannerItemText, !selectedPlannerId && { color: colors.primary }]}>
                  No preference
                </Text>
              </Pressable>
              {plannersLoading ? (
                <ActivityIndicator style={{ padding: spacing.md }} color={colors.primary} />
              ) : (
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {planners.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.plannerItem}
                      onPress={() => {
                        setSelectedPlannerId(item.id);
                        setSelectedPlannerName(item.agencyName || item.name);
                        setShowPlannerPicker(false);
                      }}
                    >
                      <Text style={[styles.plannerItemText, selectedPlannerId === item.id && { color: colors.primary }]}>
                        {item.agencyName || item.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Special Notes */}
          <Text style={styles.label}>Special Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requirements, team-building activities, dietary needs..."
            placeholderTextColor={colors.outline}
            value={specialNotes}
            onChangeText={setSpecialNotes}
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
      </KeyboardAwareScroll>
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
    backgroundColor: colors.primaryTint,
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
  pickerButton: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  plannerList: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  plannerItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  plannerItemText: {
    ...typography.bodyMd,
    color: colors.onSurface,
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
