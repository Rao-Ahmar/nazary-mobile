import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { AvatarGroup } from '../../components/AvatarGroup';
import { useBookingStore } from '../../store/bookingStore';
import type { PlannerBooking } from '../../api/bookings';

interface TripGroup {
  tripId: string;
  tripTitle: string;
  tripHeroImage?: string;
  tripLocation?: string;
  bookings: PlannerBooking[];
  pendingCount: number;
  confirmedCount: number;
}

export function BookingRequestsScreen({ navigation }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { plannerBookings, fetchPlannerBookings } = useBookingStore();

  useEffect(() => {
    fetchPlannerBookings();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPlannerBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const tripGroups = useMemo<TripGroup[]>(() => {
    const map = new Map<string, TripGroup>();
    for (const booking of plannerBookings) {
      const tripId = booking.tripId ?? booking.trip_id ?? '';
      if (!tripId) continue;
      let group = map.get(tripId);
      if (!group) {
        group = {
          tripId,
          tripTitle: booking.tripTitle ?? booking.trip_title ?? 'Untitled Trip',
          tripHeroImage: booking.tripHeroImage ?? booking.trip_hero_image,
          tripLocation: booking.tripLocation ?? booking.trip_location,
          bookings: [],
          pendingCount: 0,
          confirmedCount: 0,
        };
        map.set(tripId, group);
      }
      group.bookings.push(booking);
      if (booking.status === 'pending') group.pendingCount++;
      if (booking.status === 'confirmed') group.confirmedCount++;
    }
    return Array.from(map.values());
  }, [plannerBookings]);

  const anims = useRef(tripGroups.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    // Reset and re-animate when groups change
    anims.forEach((anim, i) => {
      anim.setValue(0);
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 80);
    });
  }, [tripGroups.length]);

  const fadeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Booking Requests</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tripGroups.length === 0 ? (
          <EmptyState icon="people-outline" title="No Bookings" message="Booking requests from travelers will appear here" />
        ) : (
          tripGroups.map((group, i) => {
            const avatars = group.bookings.map((b) => ({
              uri: b.travelerAvatar ?? b.traveler_avatar,
              name: b.travelerName ?? b.traveler_name,
            }));

            return (
              <Animated.View key={group.tripId} style={fadeStyle(anims[i] || new Animated.Value(1))}>
                <Pressable
                  onPress={() => navigation.navigate('TripDetails', { tripId: group.tripId })}
                  style={[styles.card, shadows.soft]}
                >
                  <View style={styles.cardTop}>
                    {group.tripHeroImage ? (
                      <Image source={{ uri: group.tripHeroImage }} style={styles.heroImage} />
                    ) : (
                      <LinearGradient
                        colors={[colors.primaryTint, colors.surfaceContainerHigh]}
                        style={[styles.heroImage, styles.heroPlaceholder]}
                      >
                        <Ionicons name="map-outline" size={28} color={colors.primary} />
                      </LinearGradient>
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.tripTitle} numberOfLines={1}>{group.tripTitle}</Text>
                      {group.tripLocation ? (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
                          <Text style={styles.locationText} numberOfLines={1}>{group.tripLocation}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.statusSummary}>
                        {group.confirmedCount > 0 ? `${group.confirmedCount} confirmed` : ''}
                        {group.confirmedCount > 0 && group.pendingCount > 0 ? ', ' : ''}
                        {group.pendingCount > 0 ? `${group.pendingCount} pending` : ''}
                        {group.confirmedCount === 0 && group.pendingCount === 0 ? `${group.bookings.length} bookings` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
                  </View>
                  <View style={styles.cardBottom}>
                    <AvatarGroup avatars={avatars} max={4} size={32} />
                    <Text style={styles.travelerCount}>
                      {group.bookings.length} traveler{group.bookings.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.xl },
  scrollContent: { paddingHorizontal: spacing.xl },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  heroImage: { width: 80, height: 80, borderRadius: radii.lg },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  tripTitle: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  locationText: { fontFamily: 'Inter_300Light', fontSize: 12, color: colors.onSurfaceVariant },
  statusSummary: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary, marginTop: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  travelerCount: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
});
