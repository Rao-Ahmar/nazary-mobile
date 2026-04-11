import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { tripsApi } from '../../api/trips';
import { agencyTrips } from '../../data/mockData';

type TripItem = {
  id: string;
  title: string;
  location: string;
  heroImage?: string;
  hero_image?: string;
  price: number;
  currency: string;
  dates: string;
  status: string;
  seatsLeft?: number;
  seats_left?: number;
  totalSeats?: number;
  total_seats?: number;
};

const TABS = ['All', 'Active', 'Draft', 'Completed'] as const;

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: colors.successLight, text: colors.success },
  draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  completed: { bg: 'rgba(0,88,188,0.08)', text: colors.primary },
  cancelled: { bg: colors.errorContainer, text: colors.error },
};

export function ManageTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const response = await tripsApi.getMyTrips();
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
      setTrips(data as TripItem[]);
    } catch {
      // Fallback to mock
      const mock: TripItem[] = agencyTrips.map((t) => ({
        id: t.id,
        title: t.title,
        location: 'Pakistan',
        price: 0,
        currency: 'PKR',
        dates: `Starts ${t.startDate}`,
        status: t.status,
        heroImage: undefined,
        totalSeats: t.capacity,
        seatsLeft: t.capacity - t.bookings,
      }));
      setTrips(mock);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadTrips(); }, []));

  const filtered = activeTab === 'All'
    ? trips
    : trips.filter((t) => t.status === activeTab.toLowerCase());

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

  const renderTrip = ({ item }: { item: TripItem }) => {
    const image = item.heroImage || item.hero_image;
    const statusStyle = statusColors[item.status] ?? statusColors.draft;
    const seats = item.seatsLeft ?? item.seats_left ?? 0;
    const total = item.totalSeats ?? item.total_seats ?? 0;

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
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {(item.status ?? 'draft').charAt(0).toUpperCase() + (item.status ?? 'draft').slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.tripDates}>{item.dates}</Text>
            <View style={styles.tripBottomRow}>
              <Text style={styles.tripPrice}>PKR {item.price.toLocaleString()}</Text>
              {total > 0 && <Text style={styles.tripSeats}>{seats}/{total} seats</Text>}
            </View>
          </View>
        </Pressable>
        {item.status === 'draft' && (
          <View style={styles.actionRow}>
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
          </View>
        )}
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
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to create your first trip</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
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
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  emptyState: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.md },
  emptyTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  emptySubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
