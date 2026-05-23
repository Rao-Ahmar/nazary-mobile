import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { useTripRequestStore } from '../../store/tripRequestStore';
import { useBookingStore } from '../../store/bookingStore';
import { StatusBadge } from '../../components/StatusBadge';
import { TourOverlay, useTourGuide } from '../../components/tour';
import type { Booking } from '../../types';

function formatPrice(amount: number) {
  return `PKR ${amount?.toLocaleString() ?? 0}`;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function MyTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { myRequests, isLoading: requestsLoading, fetchMyRequests } = useTripRequestStore();
  const { myBookings, isLoading: bookingsLoading, fetchMyBookings } = useBookingStore();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Tour guide
  const requestsRef = useRef<View>(null);
  const bookedRef = useRef<View>(null);
  const { tourVisible, tourSteps, completeTour } = useTourGuide(
    'traveler_mytrips',
    [requestsRef, bookedRef],
    [
      { id: 'requests', title: 'Your Requests', description: 'Track custom trip requests you\'ve sent to planners', icon: 'document-text' },
      { id: 'booked', title: 'Booked Trips', description: 'View your confirmed bookings and upcoming trip details', icon: 'map' },
    ],
  );

  useEffect(() => {
    fetchMyRequests();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyRequests();
      fetchMyBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const renderBookingCard = (booking: Booking) => {
    const title = booking.tripTitle ?? booking.trip_title;
    const location = booking.tripLocation ?? booking.trip_location;
    const heroImage = booking.tripHeroImage ?? booking.trip_hero_image;
    const date = booking.createdAt ?? booking.created_at ?? '';

    return (
      <Pressable
        key={booking.id}
        onPress={() => navigation.navigate('TripDetails', { tripId: booking.tripId ?? booking.trip_id })}
        style={[styles.bookingCard, shadows.soft]}
      >
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.bookingImage} />
        ) : (
          <View style={[styles.bookingImage, styles.bookingImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color={colors.outlineVariant} />
          </View>
        )}
        <View style={styles.bookingContent}>
          <View style={styles.bookingTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle} numberOfLines={1}>
                {title || `Booking #${booking.id}`}
              </Text>
              {location ? (
                <View style={styles.bookingLocationRow}>
                  <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
                  <Text style={styles.bookingLocation} numberOfLines={1}>{location}</Text>
                </View>
              ) : null}
            </View>
            <StatusBadge status={booking.status} />
          </View>
          <View style={styles.bookingMeta}>
            <Text style={styles.bookingPrice}>{formatPrice(booking.amount)}</Text>
            {booking.seats ? (
              <Text style={styles.bookingSeats}>{booking.seats} {booking.seats === 1 ? 'seat' : 'seats'}</Text>
            ) : null}
            <Text style={styles.bookingDate}>{formatDate(date)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>My Trips</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* My Requests Section */}
        <View ref={requestsRef} collapsable={false} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Requests</Text>
            {myRequests.length > 0 && (
              <Pressable onPress={() => navigation.navigate('MyTripRequests')}>
                <Text style={styles.seeAll}>SEE ALL</Text>
              </Pressable>
            )}
          </View>

          {requestsLoading && myRequests.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.xl }} />
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={32} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No custom trip requests yet</Text>
            </View>
          ) : (
            myRequests.slice(0, 3).map((req) => (
              <Pressable
                key={req.id}
                onPress={() => navigation.navigate('TripRequestDetail', { requestId: req.id })}
                style={[styles.requestCard, shadows.soft]}
              >
                <View style={styles.requestTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestDest}>{req.destination}</Text>
                    <Text style={styles.requestDates}>{req.startDate} - {req.endDate}</Text>
                  </View>
                  <StatusBadge status={req.status} />
                </View>
                <Text style={styles.requestPlanner}>{req.plannerName}</Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Booked Trips Section */}
        <View ref={bookedRef} collapsable={false} style={styles.section}>
          <Text style={styles.sectionTitle}>Booked Trips</Text>

          {bookingsLoading && myBookings.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.xl }} />
          ) : myBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={32} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No booked trips yet</Text>
              <Text style={styles.emptySubtext}>Browse trips and request to join one</Text>
            </View>
          ) : (
            myBookings.map(renderBookingCard)
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <TourOverlay steps={tourSteps} visible={tourVisible} onComplete={completeTour} />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.xl },
  scrollContent: { paddingHorizontal: spacing.xl },
  section: { marginBottom: spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface },
  seeAll: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.primary, letterSpacing: 1 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing['2xl'], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  emptySubtext: { ...typography.bodySm, color: colors.outlineVariant },
  requestCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.sm },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  requestDest: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface },
  requestDates: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  requestPlanner: { fontFamily: 'Inter_300Light', fontSize: 12, color: colors.onSurfaceVariant },

  // Booking cards
  bookingCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md },
  bookingImage: { width: '100%', height: 140, backgroundColor: colors.surfaceContainerHigh },
  bookingImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bookingContent: { padding: spacing.lg },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  bookingTitle: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface, flex: 1, marginRight: spacing.sm },
  bookingLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  bookingLocation: { ...typography.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bookingPrice: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  bookingSeats: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  bookingDate: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.outlineVariant, marginLeft: 'auto' },
});
