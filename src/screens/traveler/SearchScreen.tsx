import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { tripsApi } from '../../api/trips';
import { apiClient } from '../../api/client';
import { featuredTrips } from '../../data/mockData';
import { DatePickerModal } from '../../components/DatePickerModal';

type TripItem = {
  id: string;
  title: string;
  location: string;
  heroImage?: string;
  hero_image?: string;
  price: number;
  currency: string;
  duration: string;
  dates: string;
  start_date?: string;
  seatsLeft?: number;
  seats_left?: number;
  tags: string[];
  rating: number;
  reviewCount?: number;
  review_count?: number;
  contentUpdatedAt?: string;
  content_updated_at?: string;
  isUpdated?: boolean;
  is_updated?: boolean;
  tripType?: string;
  trip_type?: string;
  isPremium?: boolean;
  is_premium?: boolean;
  host?: { name: string; avatar: string };
};

const TRIP_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Casual', value: 'casual' },
  { label: 'Family', value: 'family' },
  { label: 'Bike Trip', value: 'bike_trip' },
  { label: 'Couple Trip', value: 'couple_trip' },
];

function getTripTypeBadgeConfig(colors: Colors): Record<string, { label: string; bg: string; text: string }> {
  return {
    casual: { label: 'Casual', bg: colors.casualBg, text: colors.casualColor },
    family: { label: 'Family', bg: colors.familyBg, text: colors.familyColor },
    bike_trip: { label: 'Bike', bg: colors.bikeBg, text: colors.bikeColor },
    couple_trip: { label: 'Couple', bg: colors.coupleBg, text: colors.coupleColor },
  };
}

type Planner = {
  id: string;
  name: string;
  agency_name: string;
  avatar: string | null;
};

const CATEGORIES = ['All', 'Adventure', 'Cultural', 'Wellness', 'Bike', 'Photography', 'Family'];
const SORT_OPTIONS = [
  { label: 'Upcoming', value: 'start_date_asc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Which sub-picker to open after filter modal closes
type PendingPicker = 'dateFrom' | 'dateTo' | 'planner' | null;

export function SearchScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTripType, setSelectedTripType] = useState('');
  const [selectedSort, setSelectedSort] = useState('start_date_asc');
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state (applied)
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedPlanner, setSelectedPlanner] = useState<Planner | null>(null);

  // Modal visibility
  const [showFilters, setShowFilters] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [showPlannerPicker, setShowPlannerPicker] = useState(false);

  // Planner data
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [plannersLoading, setPlannersLoading] = useState(false);

  // Temp filter state (editing inside modal before apply)
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempDateFrom, setTempDateFrom] = useState<Date | null>(null);
  const [tempDateTo, setTempDateTo] = useState<Date | null>(null);
  const [tempPlanner, setTempPlanner] = useState<Planner | null>(null);

  // Track which picker to open after filter modal closes
  const pendingPickerRef = useRef<PendingPicker>(null);

  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const activeFilterCount = (minPrice || maxPrice ? 1 : 0) + (dateFrom || dateTo ? 1 : 0) + (selectedPlanner ? 1 : 0);

  const fetchTrips = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, sort: selectedSort };
      if (query.trim()) params.q = query.trim();
      if (selectedCategory !== 'All') params.tag = selectedCategory;
      if (minPrice) params.min_price = Number(minPrice);
      if (maxPrice) params.max_price = Number(maxPrice);
      if (dateFrom) params.start_date_from = formatDate(dateFrom);
      if (dateTo) params.start_date_to = formatDate(dateTo);
      if (selectedPlanner) params.host_id = selectedPlanner.id;
      if (selectedTripType) params.trip_type = selectedTripType;
      const response = await tripsApi.getAll(params as any);
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
      if (reset) {
        setTrips(data);
        setPage(2);
      } else {
        setTrips((prev) => [...prev, ...data]);
        setPage(p + 1);
      }
      const meta = (response.data as any)?.meta;
      setHasMore(meta ? meta.currentPage < meta.totalPages : data.length >= 10);
    } catch {
      const mock: TripItem[] = featuredTrips.map((t) => ({
        id: t.id,
        title: t.title,
        location: t.location,
        heroImage: t.image,
        price: t.price,
        currency: t.currency,
        duration: t.duration,
        dates: t.dates,
        seatsLeft: t.seatsLeft,
        tags: t.tags,
        rating: t.rating,
        reviewCount: t.reviewCount,
        host: t.host,
      }));
      const filtered = mock.filter((t) => {
        const matchQ = !query.trim() || t.title.toLowerCase().includes(query.toLowerCase()) || t.location.toLowerCase().includes(query.toLowerCase());
        const matchCat = selectedCategory === 'All' || t.tags.some((tag) => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
        const matchMin = !minPrice || t.price >= Number(minPrice);
        const matchMax = !maxPrice || t.price <= Number(maxPrice);
        return matchQ && matchCat && matchMin && matchMax;
      });
      setTrips(filtered);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedCategory, selectedTripType, selectedSort, page, minPrice, maxPrice, dateFrom, dateTo, selectedPlanner]);

  useEffect(() => {
    fetchTrips(true);
  }, [selectedCategory, selectedTripType, selectedSort, minPrice, maxPrice, dateFrom, dateTo, selectedPlanner]);

  const handleSearch = () => fetchTrips(true);

  // --- Filter modal open/close ---
  const openFilters = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempDateFrom(dateFrom);
    setTempDateTo(dateTo);
    setTempPlanner(selectedPlanner);
    setShowFilters(true);
  };

  const applyFilters = () => {
    Keyboard.dismiss();
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setSelectedPlanner(tempPlanner);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempDateFrom(null);
    setTempDateTo(null);
    setTempPlanner(null);
  };

  // --- Sub-picker flow: close filter modal first, open picker, reopen filter when done ---
  const requestDateFromPicker = () => {
    Keyboard.dismiss();
    pendingPickerRef.current = 'dateFrom';
    setShowFilters(false);
  };

  const requestDateToPicker = () => {
    Keyboard.dismiss();
    pendingPickerRef.current = 'dateTo';
    setShowFilters(false);
  };

  const requestPlannerPicker = () => {
    Keyboard.dismiss();
    pendingPickerRef.current = 'planner';
    setShowFilters(false);
  };

  // When filter modal finishes closing, open the pending picker
  const onFilterModalHide = () => {
    const pending = pendingPickerRef.current;
    pendingPickerRef.current = null;
    if (pending === 'dateFrom') {
      setShowDateFromPicker(true);
    } else if (pending === 'dateTo') {
      setShowDateToPicker(true);
    } else if (pending === 'planner') {
      setPlannersLoading(true);
      setShowPlannerPicker(true);
      loadPlanners();
    }
  };

  // When a sub-picker closes, reopen the filter modal
  const onDateFromConfirm = (date: Date) => {
    setTempDateFrom(date);
    setShowDateFromPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const onDateFromClose = () => {
    setShowDateFromPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const onDateToConfirm = (date: Date) => {
    setTempDateTo(date);
    setShowDateToPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const onDateToClose = () => {
    setShowDateToPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const onPlannerSelect = (planner: Planner | null) => {
    setTempPlanner(planner);
    setShowPlannerPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const onPlannerClose = () => {
    setShowPlannerPicker(false);
    setTimeout(() => setShowFilters(true), 300);
  };

  const loadPlanners = async () => {
    setPlannersLoading(true);
    try {
      const response = await apiClient.get('/agencies');
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
      setPlanners(data);
    } catch {
      setPlanners([]);
    } finally {
      setPlannersLoading(false);
    }
  };

  const renderTrip = ({ item }: { item: TripItem }) => {
    const image = item.heroImage || item.hero_image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80';
    const seats = item.seatsLeft ?? item.seats_left ?? 0;
    const reviews = item.reviewCount ?? item.review_count ?? 0;
    const tripType = item.tripType || item.trip_type;
    const tripTypeBadgeConfig = getTripTypeBadgeConfig(colors);
    const typeBadge = tripType ? tripTypeBadgeConfig[tripType] : null;

    return (
      <Pressable
        style={[styles.tripCard, shadows.soft]}
        onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
      >
        <Image source={{ uri: image }} style={styles.tripImage} />
        <View style={styles.tripInfo}>
          <View style={styles.tripTitleRow}>
            <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
            {(item.isUpdated || item.is_updated) && (
              <View style={styles.updatedBadge}>
                <Text style={styles.updatedBadgeText}>Updated</Text>
              </View>
            )}
          </View>
          {typeBadge && (
            <View style={[styles.tripTypeBadge, { backgroundColor: typeBadge.bg }]}>
              <Text style={[styles.tripTypeBadgeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
            </View>
          )}
          <View style={styles.tripLocation}>
            <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.tripLocationText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.tripMeta}>
            <Text style={styles.tripPrice}>PKR {item.price.toLocaleString()}</Text>
            <View style={styles.tripRating}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.tripRatingText}>{item.rating}</Text>
              <Text style={styles.tripReviews}>({reviews})</Text>
            </View>
          </View>
          <View style={styles.tripFooter}>
            <Text style={styles.tripDuration}>{item.duration}</Text>
            {seats > 0 && (
              <View style={styles.seatsBadge}>
                <Text style={styles.seatsText}>{seats} seats left</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const headerComponent = () => (
    <>
      <FlatList
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory(item)}
            style={[styles.chip, selectedCategory === item && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selectedCategory === item && styles.chipTextSelected]}>{item}</Text>
          </Pressable>
        )}
      />
      <FlatList
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        data={TRIP_TYPE_OPTIONS}
        keyExtractor={(item) => item.value || 'all'}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedTripType(item.value)}
            style={[styles.tripTypeChip, selectedTripType === item.value && styles.tripTypeChipSelected]}
          >
            <Text style={[styles.tripTypeChipText, selectedTripType === item.value && styles.tripTypeChipTextSelected]}>{item.label}</Text>
          </Pressable>
        )}
      />
      <FlatList
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        data={SORT_OPTIONS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.sortList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedSort(item.value)}
            style={[styles.sortChip, selectedSort === item.value && styles.sortChipSelected]}
          >
            <Text style={[styles.sortText, selectedSort === item.value && styles.sortTextSelected]}>{item.label}</Text>
          </Pressable>
        )}
      />
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.Text style={[styles.title, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
        Discover
      </Animated.Text>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trips, places..."
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); fetchTrips(true); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.outline} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterButton} onPress={openFilters} hitSlop={4}>
          <Ionicons name="options-outline" size={20} color={colors.onSurface} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={headerComponent}
        onEndReached={() => { if (hasMore && !isLoading) fetchTrips(false); }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="compass-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          ) : null
        }
        ListFooterComponent={isLoading ? <ActivityIndicator color={colors.primary} style={{ padding: spacing.xl }} /> : null}
      />

      {/* ==================== FILTER MODAL ==================== */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
        onDismiss={onFilterModalHide}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.card]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <Pressable onPress={() => setShowFilters(false)} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.onSurface} />
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingBottom: spacing.md }}>
                {/* Budget Range */}
                <Text style={styles.filterSectionTitle}>Budget Range (PKR)</Text>
                <View style={styles.budgetRow}>
                  <View style={styles.budgetInputWrap}>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="Min"
                      placeholderTextColor={colors.outline}
                      keyboardType="numeric"
                      value={tempMinPrice}
                      onChangeText={setTempMinPrice}
                    />
                  </View>
                  <Text style={styles.budgetDash}>—</Text>
                  <View style={styles.budgetInputWrap}>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="Max"
                      placeholderTextColor={colors.outline}
                      keyboardType="numeric"
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                    />
                  </View>
                </View>

                {/* Travel Dates */}
                <Text style={styles.filterSectionTitle}>Travel Dates</Text>
                <View style={styles.budgetRow}>
                  <Pressable style={styles.dateField} onPress={requestDateFromPicker}>
                    <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                    <Text style={[styles.dateFieldText, !tempDateFrom && { color: colors.outline }]} numberOfLines={1}>
                      {tempDateFrom ? formatDisplayDate(tempDateFrom) : 'From'}
                    </Text>
                  </Pressable>
                  <Text style={styles.budgetDash}>—</Text>
                  <Pressable style={styles.dateField} onPress={requestDateToPicker}>
                    <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                    <Text style={[styles.dateFieldText, !tempDateTo && { color: colors.outline }]} numberOfLines={1}>
                      {tempDateTo ? formatDisplayDate(tempDateTo) : 'To'}
                    </Text>
                  </Pressable>
                </View>

                {/* Trip Planner */}
                <Text style={styles.filterSectionTitle}>Trip Planner</Text>
                <Pressable style={styles.plannerField} onPress={requestPlannerPicker}>
                  {tempPlanner ? (
                    <View style={styles.plannerSelected}>
                      {tempPlanner.avatar ? (
                        <Image source={{ uri: tempPlanner.avatar }} style={styles.plannerAvatar} />
                      ) : (
                        <View style={[styles.plannerAvatar, styles.plannerAvatarPlaceholder]}>
                          <Ionicons name="person" size={14} color={colors.outline} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plannerName}>{tempPlanner.name}</Text>
                        {tempPlanner.agency_name ? <Text style={styles.plannerAgency}>{tempPlanner.agency_name}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.outline} />
                    </View>
                  ) : (
                    <View style={styles.plannerSelected}>
                      <Ionicons name="people-outline" size={18} color={colors.outline} />
                      <Text style={[styles.plannerName, { color: colors.outline, flex: 1 }]}>Any Planner</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.outline} />
                    </View>
                  )}
                </Pressable>
              </ScrollView>

              {/* Footer Buttons */}
              <View style={styles.modalFooter}>
                <Pressable style={styles.clearButton} onPress={clearAllFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== PLANNER PICKER MODAL ==================== */}
      <Modal
        visible={showPlannerPicker}
        transparent
        animationType="fade"
        onRequestClose={onPlannerClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Planner</Text>
              <Pressable onPress={onPlannerClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            {plannersLoading ? (
              <ActivityIndicator color={colors.primary} style={{ padding: spacing['3xl'] }} />
            ) : (
              <FlatList
                data={planners}
                keyExtractor={(item) => item.id}
                style={styles.plannerList}
                ListHeaderComponent={
                  <Pressable style={styles.plannerListItem} onPress={() => onPlannerSelect(null)}>
                    <View style={[styles.plannerListAvatar, styles.plannerAvatarPlaceholder]}>
                      <Ionicons name="people" size={16} color={colors.outline} />
                    </View>
                    <Text style={[styles.plannerListName, { flex: 1 }]}>Any Planner</Text>
                    {!tempPlanner && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </Pressable>
                }
                renderItem={({ item }) => (
                  <Pressable style={styles.plannerListItem} onPress={() => onPlannerSelect(item)}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.plannerListAvatar} />
                    ) : (
                      <View style={[styles.plannerListAvatar, styles.plannerAvatarPlaceholder]}>
                        <Ionicons name="person" size={16} color={colors.outline} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.plannerListName}>{item.name}</Text>
                      {item.agency_name ? <Text style={styles.plannerListAgency}>{item.agency_name}</Text> : null}
                    </View>
                    {tempPlanner?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptySubtitle}>No planners found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ==================== DATE PICKERS ==================== */}
      <DatePickerModal
        visible={showDateFromPicker}
        value={tempDateFrom || new Date()}
        minimumDate={new Date()}
        title="From Date"
        onConfirm={onDateFromConfirm}
        onClose={onDateFromClose}
      />
      <DatePickerModal
        visible={showDateToPicker}
        value={tempDateTo || tempDateFrom || new Date()}
        minimumDate={tempDateFrom || new Date()}
        title="To Date"
        onConfirm={onDateToConfirm}
        onClose={onDateToClose}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: {
    fontFamily: 'Manrope_300Light',
    fontSize: 32,
    color: colors.onSurface,
    letterSpacing: -0.5,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.onPrimary,
  },
  chipList: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  chipTextSelected: { color: colors.onPrimary },
  sortList: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
  },
  sortChipSelected: { backgroundColor: colors.surfaceContainerHigh },
  sortText: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.outline, letterSpacing: 0.3 },
  sortTextSelected: { color: colors.onSurface, fontFamily: 'Inter_400Regular' },
  resultsList: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  tripCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tripImage: { width: 110, height: 130 },
  tripInfo: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  tripTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  tripTitle: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface, flex: 1 },
  updatedBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full },
  updatedBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: colors.warning },
  tripLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tripLocationText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  tripMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  tripPrice: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.primary },
  tripRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tripRatingText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurface },
  tripReviews: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  tripDuration: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  seatsBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  seatsText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.success },
  emptyState: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.md },
  emptyTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  emptySubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant },

  // Centered Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    width: '88%',
    maxHeight: '75%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
  },
  filterSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  budgetInputWrap: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 46,
    justifyContent: 'center',
  },
  budgetInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  budgetDash: {
    fontFamily: 'Inter_300Light',
    fontSize: 14,
    color: colors.outline,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 46,
    gap: spacing.sm,
  },
  dateFieldText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  plannerField: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
  },
  plannerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  plannerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  plannerAvatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  plannerAgency: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  applyButton: {
    flex: 2,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onPrimary,
  },

  // Planner Picker
  plannerList: {
    maxHeight: 350,
  },
  plannerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  plannerListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  plannerListName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  plannerListAgency: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // Trip Type chips
  tripTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tripTypeChipSelected: {
    backgroundColor: colors.casualBg,
    borderColor: colors.casualColor,
  },
  tripTypeChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  tripTypeChipTextSelected: {
    color: colors.casualColor,
  },

  // Trip Type badge on cards
  tripTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginTop: 2,
  },
  tripTypeBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
