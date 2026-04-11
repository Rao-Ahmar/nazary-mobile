import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch, Alert, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { DatePickerModal } from '../../components/DatePickerModal';
import { arrangementApi } from '../../api/arrangements';

export function ArrangeATripScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [destination, setDestination] = useState('');
  const [surpriseMe, setSurpriseMe] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [budgetMin, setBudgetMin] = useState('20000');
  const [budgetMax, setBudgetMax] = useState('80000');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(contentOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const handleSubmit = async () => {
    if (!startDate || !endDate) return Alert.alert('Required', 'Please select your travel start and end dates.');
    if (startDateObj && startDateObj < new Date(new Date().toDateString())) {
      return Alert.alert('Invalid Date', 'Start date cannot be in the past.');
    }
    if (startDateObj && endDateObj && endDateObj <= startDateObj) {
      return Alert.alert('Invalid Date', 'End date must be after start date.');
    }
    setIsLoading(true);
    try {
      await arrangementApi.create({
        preferred_destination: surpriseMe ? undefined : destination,
        travel_dates: `${startDate} - ${endDate}`,
        group_size: groupSize,
        budget_min: parseFloat(budgetMin) || 0,
        budget_max: parseFloat(budgetMax) || 0,
        special_notes: specialNotes,
      });
      Alert.alert('Request Submitted!', 'Our team will review your request and arrange the perfect trip for you.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Arrange a Trip</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentOpacity }}>
          {/* Premium Badge */}
          <LinearGradient colors={['#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.premiumText}>Premium Service by Nazary</Text>
          </LinearGradient>

          <Text style={styles.description}>Tell us your preferences and our team will curate the perfect trip for you.</Text>

          {/* Destination */}
          <Text style={styles.label}>Destination Preference</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Surprise me!</Text>
            <Switch value={surpriseMe} onValueChange={setSurpriseMe} trackColor={{ true: colors.primary }} />
          </View>
          {!surpriseMe && (
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="e.g. Hunza, Skardu..." placeholderTextColor={colors.outline} value={destination} onChangeText={setDestination} />
            </View>
          )}

          {/* Dates */}
          <Text style={styles.label}>Travel Dates</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateSubLabel}>Start</Text>
              <Pressable style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.dateText, !startDate && { color: colors.outline }]}>
                  {startDate || 'Select'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.dateDash}>—</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateSubLabel}>End</Text>
              <Pressable style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.dateText, !endDate && { color: colors.outline }]}>
                  {endDate || 'Select'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Group Size */}
          <Text style={styles.label}>Group Size</Text>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperButton} onPress={() => setGroupSize(Math.max(1, groupSize - 1))}>
              <Ionicons name="remove" size={20} color={colors.primary} />
            </Pressable>
            <Text style={styles.stepperValue}>{groupSize} {groupSize === 1 ? 'person' : 'people'}</Text>
            <Pressable style={styles.stepperButton} onPress={() => setGroupSize(Math.min(20, groupSize + 1))}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Budget */}
          <Text style={styles.label}>Budget Range (PKR)</Text>
          <View style={styles.budgetRow}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.currencyLabel}>Min</Text>
              <TextInput style={styles.input} placeholder="20,000" placeholderTextColor={colors.outline} value={budgetMin} onChangeText={setBudgetMin} keyboardType="numeric" />
            </View>
            <Text style={styles.budgetDash}>—</Text>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.currencyLabel}>Max</Text>
              <TextInput style={styles.input} placeholder="80,000" placeholderTextColor={colors.outline} value={budgetMax} onChangeText={setBudgetMax} keyboardType="numeric" />
            </View>
          </View>

          {/* Notes */}
          <Text style={styles.label}>Special Notes</Text>
          <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start', paddingVertical: spacing.md }]}>
            <TextInput style={[styles.input, { textAlignVertical: 'top', height: '100%' }]} placeholder="Any special requirements, preferences, dietary needs..." placeholderTextColor={colors.outline} value={specialNotes} onChangeText={setSpecialNotes} multiline />
          </View>

          {/* Submit */}
          <Pressable onPress={handleSubmit} disabled={isLoading} style={{ marginTop: spacing.xl }}>
            <LinearGradient colors={[colors.primary, colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submitButton, isLoading && { opacity: 0.6 }]}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.submitText}>{isLoading ? 'Submitting...' : 'Submit Request'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <DatePickerModal
        visible={showStartPicker}
        value={startDateObj || new Date()}
        minimumDate={new Date()}
        title="Start Date"
        onConfirm={(date) => {
          setStartDateObj(date);
          setStartDate(date.toISOString().split('T')[0]);
          if (endDateObj && date >= endDateObj) {
            setEndDateObj(null);
            setEndDate('');
          }
        }}
        onClose={() => setShowStartPicker(false)}
      />
      <DatePickerModal
        visible={showEndPicker}
        value={endDateObj || startDateObj || new Date()}
        minimumDate={startDateObj ? new Date(startDateObj.getTime() + 86400000) : new Date()}
        title="End Date"
        onConfirm={(date) => {
          setEndDateObj(date);
          setEndDate(date.toISOString().split('T')[0]);
        }}
        onClose={() => setShowEndPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full, marginBottom: spacing.lg },
  premiumText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#fff', letterSpacing: 0.3 },
  description: { ...typography.bodyLg, color: colors.onSurfaceVariant, marginBottom: spacing['2xl'] },
  label: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.lg },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.lg, height: 56 },
  inputIcon: { marginRight: spacing.md },
  input: { flex: 1, ...typography.bodyLg, color: colors.onSurface },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  switchLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepperButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, minWidth: 100, textAlign: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dateSubLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 6 },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  dateDash: { ...typography.bodyLg, color: colors.outline, marginTop: 28 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  budgetDash: { ...typography.bodyLg, color: colors.outline },
  currencyLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.outline, marginRight: spacing.sm },
  submitButton: { height: 56, borderRadius: radii.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
});
