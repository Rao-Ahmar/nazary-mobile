import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { CategoryChip } from '../../components/CategoryChip';
import { DatePickerModal } from '../../components/DatePickerModal';
import { useTripRequestStore } from '../../store/tripRequestStore';
import type { CustomTripRequest } from '../../types';

const tripCategories = ['Adventure', 'Cultural', 'Wellness', 'Culinary', 'Safari', 'Bike'];

export function CreateTripRequestScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const addRequest = useTripRequestStore((s) => s.addRequest);
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const canSubmit = destination.trim() && startDate && endDate && seats.trim();

  const handleSubmit = () => {
    if (startDateObj && startDateObj < new Date(new Date().toDateString())) {
      return Alert.alert('Invalid Date', 'Start date cannot be in the past.');
    }
    if (startDateObj && endDateObj && endDateObj <= startDateObj) {
      return Alert.alert('Invalid Date', 'End date must be after start date.');
    }
    const request: CustomTripRequest = {
      id: Date.now().toString(),
      travelerId: 'dev-traveler',
      travelerName: 'Alex Traveler',
      plannerId: route.params?.plannerId || '1',
      plannerName: 'Alex Romanov',
      plannerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      destination,
      startDate,
      endDate,
      seats: parseInt(seats, 10),
      category: category || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      note: note || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    addRequest(request);
    navigation.goBack();
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
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
            colors={['#0058bc', '#0070eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, !canSubmit && { opacity: 0.5 }]}
          >
            <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: spacing.sm }} />
            <Text style={styles.submitText}>Send Request</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
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
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#fff' },
});
