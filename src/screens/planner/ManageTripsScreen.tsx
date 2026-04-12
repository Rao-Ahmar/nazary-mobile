import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { tripsApi } from '../../api/trips';
import { DatePickerModal } from '../../components/DatePickerModal';

type TripItem = {
  id: string;
  title: string;
  location: string;
  heroImage?: string;
  hero_image?: string;
  price: number;
  currency: string;
  dates: string;
  startDate?: string;
  start_date?: string;
  status: string;
  seatsLeft?: number;
  seats_left?: number;
  totalSeats?: number;
  total_seats?: number;
  recurringEnabled?: boolean;
  recurring_enabled?: boolean;
  sourceTripId?: string;
  source_trip_id?: string;
};

const TABS = ['All', 'Active', 'Draft', 'Completed'] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ManageTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: colors.successLight, text: colors.success },
    draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
    completed: { bg: colors.primaryTint, text: colors.primary },
    cancelled: { bg: colors.errorContainer, text: colors.error },
  };

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
  const [dateToObj, setDateToObj] = useState<Date | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  // Reschedule modal
  const [rescheduleTrip, setRescheduleTrip] = useState<TripItem | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduleSeats, setRescheduleSeats] = useState('');
  const [rescheduleStartObj, setRescheduleStartObj] = useState<Date | null>(null);
  const [rescheduleEndObj, setRescheduleEndObj] = useState<Date | null>(null);
  const [showRescheduleStartPicker, setShowRescheduleStartPicker] = useState(false);
  const [showRescheduleEndPicker, setShowRescheduleEndPicker] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef(searchQuery);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchRef.current.trim()) params.q = searchRef.current.trim();
      if (activeTab !== 'All') params.status = activeTab.toLowerCase();
      if (minPrice) params.min_price = parseFloat(minPrice);
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      if (dateFrom) params.start_date_from = dateFrom;
      if (dateTo) params.start_date_to = dateTo;

      const response = await tripsApi.getMyTrips(params);
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
      setTrips(data as TripItem[]);
    } catch {
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, minPrice, maxPrice, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { loadTrips(); }, [loadTrips]));

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchRef.current = text;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadTrips(), 400);
  };

  const handlePublish = async (id: string) => {
    try {
      await tripsApi.publish(id);
      loadTrips();
    } catch {
      Alert.alert('Error', 'Could not publish trip');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Trip', 'Are you sure? Only draft trips can be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tripsApi.destroy(id);
            loadTrips();
          } catch {
            Alert.alert('Error', 'Could not delete trip');
          }
        },
      },
    ]);
  };

  const handleStopRecurring = (id: string) => {
    Alert.alert('Stop Recurring', 'This trip will no longer auto-repeat. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          try {
            await tripsApi.stopRecurring(id);
            loadTrips();
          } catch {
            Alert.alert('Error', 'Could not stop recurring');
          }
        },
      },
    ]);
  };

  const openReschedule = (item: TripItem) => {
    setRescheduleTrip(item);
    setRescheduleStart('');
    setRescheduleEnd('');
    setRescheduleSeats(String(item.totalSeats ?? item.total_seats ?? ''));
    setRescheduleStartObj(null);
    setRescheduleEndObj(null);
  };

  const submitReschedule = async () => {
    if (!rescheduleTrip || !rescheduleStart || !rescheduleEnd) {
      Alert.alert('Missing Dates', 'Please select start and end dates.');
      return;
    }
    setIsRescheduling(true);
    try {
      const data: any = { start_date: rescheduleStart, end_date: rescheduleEnd };
      if (rescheduleSeats) data.total_seats = parseInt(rescheduleSeats, 10);
      await tripsApi.reschedule(rescheduleTrip.id, data);
      setRescheduleTrip(null);
      Alert.alert('Success', 'Trip rescheduled as a new draft. You can edit and publish it.');
      loadTrips();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not reschedule trip');
    } finally {
      setIsRescheduling(false);
    }
  };

  const clearFilters = async () => {
    setMinPrice('');
    setMaxPrice('');
    setDateFrom('');
    setDateTo('');
    setDateFromObj(null);
    setDateToObj(null);
    // Reload directly with cleared params
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchRef.current.trim()) params.q = searchRef.current.trim();
      if (activeTab !== 'All') params.status = activeTab.toLowerCase();
      const response = await tripsApi.getMyTrips(params);
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
      setTrips(data as TripItem[]);
    } catch {
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveFilters = minPrice || maxPrice || dateFrom || dateTo;

  const renderTrip = ({ item }: { item: TripItem }) => {
    const image = item.heroImage || item.hero_image;
    const statusStyle = statusColors[item.status] ?? statusColors.draft;
    const seats = item.seatsLeft ?? item.seats_left ?? 0;
    const total = item.totalSeats ?? item.total_seats ?? 0;
    const isRecurring = item.recurringEnabled ?? item.recurring_enabled;
    const isRescheduled = item.sourceTripId ?? item.source_trip_id;

    return (
      <View style={[styles.tripCard, shadows.soft]}>
        <Pressable
          style={styles.tripCardInner}
          onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.tripImage} />
          ) : (
            <View style={[styles.tripImage, styles.tripImagePlaceholder]}>
              <Ionicons name="image-outline" size={24} color={colors.outlineVariant} />
            </View>
          )}
          <View style={styles.tripInfo}>
            <View style={styles.tripTopRow}>
              <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                {isRecurring && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.loopBg }]}>
                    <Text style={[styles.statusText, { color: colors.loopColor }]}>Loop</Text>
                  </View>
                )}
                {isRescheduled && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.rerunBg }]}>
                    <Text style={[styles.statusText, { color: colors.rerunColor }]}>Rerun</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {(item.status ?? 'draft').charAt(0).toUpperCase() + (item.status ?? 'draft').slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.tripDates}>{item.dates}</Text>
            <View style={styles.tripBottomRow}>
              <Text style={styles.tripPrice}>PKR {item.price.toLocaleString()}</Text>
              {total > 0 && <Text style={styles.tripSeats}>{seats}/{total} seats</Text>}
            </View>
          </View>
        </Pressable>
        <View style={styles.actionRow}>
          {item.status === 'draft' && (
            <>
              <Pressable style={styles.actionButton} onPress={() => handlePublish(item.id)}>
                <Ionicons name="rocket-outline" size={14} color={colors.primary} />
                <Text style={styles.actionText}>Publish</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => navigation.navigate('CreateTrip', { tripId: item.id })}>
                <Ionicons name="create-outline" size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.actionText, { color: colors.onSurfaceVariant }]}>Edit</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={14} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </>
          )}
          {(item.status === 'completed' || item.status === 'active') && (
            <Pressable style={styles.actionButton} onPress={() => openReschedule(item)}>
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={styles.actionText}>Reschedule</Text>
            </Pressable>
          )}
          {isRecurring && item.status === 'active' && (
            <Pressable style={styles.actionButton} onPress={() => handleStopRecurring(item.id)}>
              <Ionicons name="stop-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Stop Loop</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Trips</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTrip', {})}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search trips..."
              placeholderTextColor={colors.outline}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(''); loadTrips(); }} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.outlineVariant} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={[styles.filterToggle, hasActiveFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? colors.onPrimary : colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Filter Panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>Min Price</Text>
                <TextInput style={styles.filterInput} placeholder="0" placeholderTextColor={colors.outline} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>Max Price</Text>
                <TextInput style={styles.filterInput} placeholder="999999" placeholderTextColor={colors.outline} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.filterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>From Date</Text>
                <Pressable style={styles.filterDateBtn} onPress={() => setShowDateFromPicker(true)}>
                  <Text style={[styles.filterDateText, !dateFrom && { color: colors.outline }]}>{dateFrom || 'Any'}</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>To Date</Text>
                <Pressable style={styles.filterDateBtn} onPress={() => setShowDateToPicker(true)}>
                  <Text style={[styles.filterDateText, !dateTo && { color: colors.outline }]}>{dateTo || 'Any'}</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <Pressable style={styles.filterApplyBtn} onPress={loadTrips}>
                <Text style={styles.filterApplyText}>Apply</Text>
              </Pressable>
              {hasActiveFilters && (
                <Pressable onPress={clearFilters}>
                  <Text style={{ ...typography.bodyMd, color: colors.error }}>Clear</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'Tap + to create your first trip'}
              </Text>
            </View>
          }
        />
      )}

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduleTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Trip</Text>
              <Pressable onPress={() => setRescheduleTrip(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
            {rescheduleTrip && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>{rescheduleTrip.title}</Text>
            )}

            <Text style={styles.filterLabel}>New Start Date *</Text>
            <Pressable style={styles.filterDateBtn} onPress={() => setShowRescheduleStartPicker(true)}>
              <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={[styles.filterDateText, !rescheduleStart && { color: colors.outline }]}>
                {rescheduleStart || 'Select date'}
              </Text>
            </Pressable>

            <Text style={[styles.filterLabel, { marginTop: spacing.md }]}>New End Date *</Text>
            <Pressable style={styles.filterDateBtn} onPress={() => setShowRescheduleEndPicker(true)}>
              <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={[styles.filterDateText, !rescheduleEnd && { color: colors.outline }]}>
                {rescheduleEnd || 'Select date'}
              </Text>
            </Pressable>

            <Text style={[styles.filterLabel, { marginTop: spacing.md }]}>Total Seats</Text>
            <TextInput
              style={styles.filterInput}
              value={rescheduleSeats}
              onChangeText={setRescheduleSeats}
              keyboardType="numeric"
              placeholder="Same as original"
              placeholderTextColor={colors.outline}
            />

            <Pressable
              style={[styles.rescheduleSubmit, isRescheduling && { opacity: 0.6 }]}
              onPress={submitReschedule}
              disabled={isRescheduling}
            >
              <Text style={styles.rescheduleSubmitText}>
                {isRescheduling ? 'Creating...' : 'Create Rescheduled Trip'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Filter date pickers */}
      <DatePickerModal
        visible={showDateFromPicker}
        value={dateFromObj || new Date()}
        title="From Date"
        onConfirm={(date) => {
          setDateFromObj(date);
          setDateFrom(date.toISOString().split('T')[0]);
        }}
        onClose={() => setShowDateFromPicker(false)}
      />
      <DatePickerModal
        visible={showDateToPicker}
        value={dateToObj || new Date()}
        title="To Date"
        onConfirm={(date) => {
          setDateToObj(date);
          setDateTo(date.toISOString().split('T')[0]);
        }}
        onClose={() => setShowDateToPicker(false)}
      />

      {/* Reschedule date pickers */}
      <DatePickerModal
        visible={showRescheduleStartPicker}
        value={rescheduleStartObj || new Date()}
        minimumDate={new Date()}
        title="Start Date"
        onConfirm={(date) => {
          setRescheduleStartObj(date);
          setRescheduleStart(date.toISOString().split('T')[0]);
          if (rescheduleEndObj && date >= rescheduleEndObj) {
            setRescheduleEndObj(null);
            setRescheduleEnd('');
          }
        }}
        onClose={() => setShowRescheduleStartPicker(false)}
      />
      <DatePickerModal
        visible={showRescheduleEndPicker}
        value={rescheduleEndObj || rescheduleStartObj || new Date()}
        minimumDate={rescheduleStartObj ? new Date(rescheduleStartObj.getTime() + 86400000) : new Date()}
        title="End Date"
        onConfirm={(date) => {
          setRescheduleEndObj(date);
          setRescheduleEnd(date.toISOString().split('T')[0]);
        }}
        onClose={() => setShowRescheduleEndPicker(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleActive: {
    backgroundColor: colors.primary,
  },
  // Filter Panel
  filterPanel: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  filterInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 36,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  filterDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 36,
  },
  filterDateText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  filterApplyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  filterApplyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.onPrimary,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary },
  // List
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  tripCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tripCardInner: { flexDirection: 'row' },
  tripImage: { width: 100, height: 100 },
  tripImagePlaceholder: { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  tripInfo: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  tripTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  tripTitle: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.full },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 0.3 },
  tripDates: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 },
  tripBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  tripPrice: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.primary },
  tripSeats: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  emptyState: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.md },
  emptyTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  emptySubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.xl },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
  },
  modalSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  rescheduleSubmit: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  rescheduleSubmitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.onPrimary,
  },
});
