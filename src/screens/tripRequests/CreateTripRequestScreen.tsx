import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { CategoryChip } from '../../components/CategoryChip';
import { DatePickerModal } from '../../components/DatePickerModal';
import { tripRequestsApi } from '../../api/tripRequests';
import { plannersApi } from '../../api/planners';
import { useAlert } from '../../components/ThemedAlert';
import type { Agency } from '../../types';

const tripCategories = ['Family Trips', 'Friends', 'Couple Trips'];

export function CreateTripRequestScreen({ navigation, route }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();

  const insets = useSafeAreaInsets();
  const preselectedPlannerId = route.params?.plannerId;
  const preselectedPlannerName = route.params?.plannerName;

  const [selectedPlanner, setSelectedPlanner] = useState<{ id: string; name: string } | null>(
    preselectedPlannerId ? { id: preselectedPlannerId, name: preselectedPlannerName || '' } : null,
  );
  const [plannerQuery, setPlannerQuery] = useState(preselectedPlannerName || '');
  const [plannerResults, setPlannerResults] = useState<Agency[]>([]);
  const [searchingPlanners, setSearchingPlanners] = useState(false);
  const [showPlannerDropdown, setShowPlannerDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [seats, setSeats] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // Fetch preselected planner name if only ID was passed
  useEffect(() => {
    if (preselectedPlannerId && !preselectedPlannerName) {
      plannersApi.getById(preselectedPlannerId).then((res) => {
        const data = (res.data as any)?.data ?? res.data;
        const name = data.agencyName || data.agency_name || data.name || '';
        setSelectedPlanner({ id: preselectedPlannerId, name });
        setPlannerQuery(name);
      }).catch(() => {});
    }
  }, [preselectedPlannerId, preselectedPlannerName]);

  const searchPlanners = useCallback((query: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.trim().length < 2) {
      setPlannerResults([]);
      setShowPlannerDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchingPlanners(true);
      try {
        const res = await plannersApi.getAll({ q: query.trim() });
        const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
        setPlannerResults(data);
        setShowPlannerDropdown(data.length > 0);
      } catch {
        setPlannerResults([]);
      } finally {
        setSearchingPlanners(false);
      }
    }, 300);
  }, []);

  const handlePlannerQueryChange = (text: string) => {
    setPlannerQuery(text);
    if (selectedPlanner) setSelectedPlanner(null);
    searchPlanners(text);
  };

  const selectPlanner = (planner: Agency) => {
    const name = planner.agencyName || planner.name;
    setSelectedPlanner({ id: planner.id, name });
    setPlannerQuery(name);
    setShowPlannerDropdown(false);
  };

  const canSubmit = selectedPlanner && destination.trim() && startDate && endDate && seats.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedPlanner) return;
    if (startDateObj && startDateObj < new Date(new Date().toDateString())) {
      alert.show({ title: 'Invalid Date', message: 'Start date cannot be in the past.', type: 'warning' }); return;
    }
    if (startDateObj && endDateObj && endDateObj <= startDateObj) {
      alert.show({ title: 'Invalid Date', message: 'End date must be after start date.', type: 'warning' }); return;
    }
    setIsSubmitting(true);
    try {
      await tripRequestsApi.create({
        plannerId: selectedPlanner.id,
        destination: destination.trim(),
        startDate,
        endDate,
        seats: parseInt(seats, 10),
        category: category || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        note: note.trim() || undefined,
      });
      alert.show({ title: 'Request Sent!', message: `Your custom trip request has been sent to ${selectedPlanner.name}.`, type: 'success', buttons: [
        { text: 'OK', onPress: () => navigation.goBack() },
      ] });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not send request. Please try again.';
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
        <Text style={styles.headerTitle}>Custom Trip Request</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {/* Planner Search */}
          <Text style={styles.fieldLabel}>Trip Planner *</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.outline} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search agency or planner name..."
              placeholderTextColor={colors.outline}
              value={plannerQuery}
              onChangeText={handlePlannerQueryChange}
              editable={!preselectedPlannerId}
            />
            {searchingPlanners && <ActivityIndicator size="small" color={colors.primary} />}
            {selectedPlanner && (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            )}
          </View>
          {showPlannerDropdown && (
            <View style={[styles.dropdown, shadows.soft]}>
              {plannerResults.map((planner) => (
                <Pressable key={planner.id} style={styles.dropdownItem} onPress={() => selectPlanner(planner)}>
                  <Ionicons name="business-outline" size={16} color={colors.onSurfaceVariant} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownName}>{planner.agencyName || planner.name}</Text>
                    {planner.city ? <Text style={styles.dropdownCity}>{planner.city}</Text> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <FormInput label="Destination" icon="location-outline" value={destination} onChangeText={setDestination} placeholder="e.g., Hunza Valley" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Pressable style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.dateText, !startDate && { color: colors.outline }]}>
                  {startDate || 'Select date'}
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Pressable style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.dateText, !endDate && { color: colors.outline }]}>
                  {endDate || 'Select date'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Seats" icon="people-outline" value={seats} onChangeText={setSeats} placeholder="2" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput label="Budget / Person (PKR)" icon="wallet-outline" value={budget} onChangeText={setBudget} placeholder="50000" keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.categoryLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {tripCategories.map((cat) => (
              <CategoryChip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(category === cat ? '' : cat)} />
            ))}
          </ScrollView>

          <FormInput label="Note (optional)" icon="chatbox-outline" value={note} onChangeText={setNote} placeholder="Any special requests or preferences..." multiline style={{ marginTop: spacing.lg }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleSubmit} disabled={!canSubmit} style={styles.submitButton}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, !canSubmit && { opacity: 0.5 }]}
          >
            <Ionicons name="send-outline" size={18} color={colors.onPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.submitText}>{isSubmitting ? 'Sending...' : 'Send Request'}</Text>
          </LinearGradient>
        </Pressable>
      </View>

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

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  fieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm, letterSpacing: 0.3 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchIcon: {},
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  dropdown: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant,
  },
  dropdownName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  dropdownCity: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  dateLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm, letterSpacing: 0.3 },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    marginBottom: spacing.md,
  },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  categoryLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm, letterSpacing: 0.3 },
  chipRow: { gap: spacing.sm, marginBottom: spacing.md },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  submitButton: { width: '100%' },
  gradient: { height: 56, borderRadius: radii.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
});
