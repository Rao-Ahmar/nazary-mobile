import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationBell } from '../../components/NotificationBell';
import { AvatarGroup } from '../../components/AvatarGroup';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import { apiClient } from '../../api/client';
import { tripsApi } from '../../api/trips';
import { useAuthStore } from '../../store';
import { TourOverlay, useTourGuide } from '../../components/tour';

interface Stats {
  totalRevenue: number;
  activeTrips: number;
  totalBookings: number;
  avgRating: number;
  monthlyGrowth: number;
}

interface DashboardTrip {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  start_date?: string;
  price: number;
  totalSeats?: number;
  total_seats?: number;
  seatsLeft?: number;
  seats_left?: number;
}

interface DashboardBooking {
  id: string;
  tripId?: string;
  trip_id?: string;
  travelerName?: string;
  traveler_name?: string;
  travelerAvatar?: string;
  traveler_avatar?: string;
  tripTitle?: string;
  trip_title?: string;
  tripHeroImage?: string;
  trip_hero_image?: string;
  tripLocation?: string;
  trip_location?: string;
  amount: number;
  status: string;
}

function useFadeIn(delay: number, duration = 500) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return anim;
}

export function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user) as any;

  // Tour guide refs
  const statsRef = useRef<View>(null);
  const nazaryLinkRef = useRef<View>(null);
  const tripsRef = useRef<View>(null);

  const { tourVisible, tourSteps, completeTour } = useTourGuide(
    'planner',
    [null, statsRef, nazaryLinkRef, tripsRef],
    [
      { id: 'welcome', title: 'Welcome to Your Dashboard!', description: 'Manage your agency and grow your travel business. Here\'s a quick tour!', icon: 'business' },
      { id: 'stats', title: 'Your Performance', description: 'Revenue, bookings, and ratings updated in real-time', icon: 'stats-chart' },
      { id: 'nazary-link', title: 'Share Your Profile', description: 'Copy your unique link to share on WhatsApp or add to your social bio', icon: 'link' },
      { id: 'trips', title: 'Manage Trips', description: 'View all trips, track bookings, and monitor seat fill rates', icon: 'map' },
    ],
  );
  const nazaryUrl = user?.nazaryUrl ?? user?.nazary_url;
  const [linkCopied, setLinkCopied] = useState(false);

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: colors.successLight, text: colors.success },
    draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
    completed: { bg: colors.primaryTint, text: colors.primary },
    cancelled: { bg: colors.errorContainer, text: colors.error },
  };

  const [stats, setStats] = useState<Stats | null>(null);
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bookingTripGroups = useMemo(() => {
    const map = new Map<string, { tripId: string; tripTitle: string; tripHeroImage?: string; tripLocation?: string; avatars: { uri?: string; name?: string }[]; pendingCount: number }>();
    for (const b of bookings) {
      const tripId = b.tripId ?? b.trip_id ?? '';
      if (!tripId) continue;
      let group = map.get(tripId);
      if (!group) {
        group = {
          tripId,
          tripTitle: b.tripTitle ?? b.trip_title ?? 'Untitled Trip',
          tripHeroImage: b.tripHeroImage ?? b.trip_hero_image,
          tripLocation: b.tripLocation ?? b.trip_location,
          avatars: [],
          pendingCount: 0,
        };
        map.set(tripId, group);
      }
      group.avatars.push({ uri: b.travelerAvatar ?? b.traveler_avatar, name: b.travelerName ?? b.traveler_name });
      if (b.status === 'pending') group.pendingCount++;
    }
    return Array.from(map.values()).slice(0, 3);
  }, [bookings]);

  const headerAnim = useFadeIn(50);
  const stat1Anim = useFadeIn(100);
  const stat2Anim = useFadeIn(150);
  const stat3Anim = useFadeIn(200);
  const stat4Anim = useFadeIn(250);
  const nazaryLinkAnim = useFadeIn(280);
  const tripsSectionAnim = useFadeIn(350);
  const bookingsSectionAnim = useFadeIn(550);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, tripsRes, bookingsRes] = await Promise.all([
        apiClient.get('/planner/stats'),
        tripsApi.getMyTrips({ page: 1 }),
        apiClient.get('/planner/bookings', { params: { per_page: 5 } }),
      ]);

      // Stats
      const s = (statsRes.data as any)?.data ?? statsRes.data;
      setStats(s);

      // Trips (take first 5)
      const tripsData = Array.isArray(tripsRes.data) ? tripsRes.data : (tripsRes.data as any)?.data ?? [];
      setTrips((tripsData as DashboardTrip[]).slice(0, 5));

      // Bookings
      const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data as any)?.data ?? [];
      setBookings((bookingsData as DashboardBooking[]).slice(0, 5));
    } catch {
      // leave defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const fadeStyle = (anim: Animated.Value, translateDistance = 20) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [translateDistance, 0] }) }],
  });

  const formatRevenue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return String(val);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.header, fadeStyle(headerAnim)]}>
          <View>
            <Text style={styles.headerTitle}>Your Agency</Text>
            <Text style={styles.headerSubtitle}>Performance overview</Text>
          </View>
          <NotificationBell />
        </Animated.View>

        {/* Stats Grid */}
        <View ref={statsRef} collapsable={false} style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat1Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="trending-up" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>PKR {formatRevenue(stats?.totalRevenue ?? 0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
            {(stats?.monthlyGrowth ?? 0) !== 0 && (
              <View style={styles.growthBadge}>
                <Ionicons
                  name={stats!.monthlyGrowth > 0 ? 'arrow-up' : 'arrow-down'}
                  size={10}
                  color={stats!.monthlyGrowth > 0 ? colors.success : colors.error}
                />
                <Text style={[styles.growthText, stats!.monthlyGrowth < 0 && { color: colors.error }]}>
                  {Math.abs(stats!.monthlyGrowth)}%
                </Text>
              </View>
            )}
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat2Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="compass-outline" size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{stats?.activeTrips ?? 0}</Text>
            <Text style={styles.statLabel}>Active Trips</Text>
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat3Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="people-outline" size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats?.totalBookings ?? 0}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat4Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.starTint }]}>
              <Ionicons name="star-outline" size={20} color={colors.star} />
            </View>
            <Text style={styles.statValue}>{stats?.avgRating ?? 0}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </Animated.View>
        </View>

        {/* Nazary Link Card */}
        {nazaryUrl ? (
          <Animated.View ref={nazaryLinkRef} collapsable={false} style={[styles.section, fadeStyle(nazaryLinkAnim)]}>
            <View style={[styles.nazaryLinkCard, shadows.soft]}>
              <View style={styles.nazaryLinkHeader}>
                <View style={[styles.nazaryLinkIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name="link-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nazaryLinkTitle}>Your Nazary Link</Text>
                  <Text style={styles.nazaryLinkSubtitle}>Share your public agency page</Text>
                </View>
              </View>
              <View style={styles.nazaryLinkUrlContainer}>
                <Text style={styles.nazaryLinkUrl} numberOfLines={1}>{nazaryUrl}</Text>
              </View>
              <View style={styles.nazaryLinkActions}>
                <Pressable
                  style={[styles.nazaryLinkButton, { backgroundColor: linkCopied ? colors.successLight : colors.primaryTint }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(nazaryUrl);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                >
                  <Ionicons name={linkCopied ? 'checkmark' : 'copy-outline'} size={16} color={linkCopied ? colors.success : colors.primary} />
                  <Text style={[styles.nazaryLinkButtonText, { color: linkCopied ? colors.success : colors.primary }]}>
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.nazaryLinkButton, { backgroundColor: '#dcf8c6' }]}
                  onPress={() => {
                    const message = `Check out my agency on Nazary: ${nazaryUrl}`;
                    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    Linking.openURL(whatsappUrl).catch(() => {});
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={[styles.nazaryLinkButtonText, { color: '#25D366' }]}>Share</Text>
                </Pressable>
              </View>
              <Text style={styles.nazaryLinkHint}>
                Add this link to your Instagram or TikTok bio to get verified on Nazary
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Social Links Encouragement Banner */}
        {!user?.instagramUrl && !user?.instagram_url && !user?.tiktokUrl && !user?.tiktok_url ? (
          <Animated.View style={[styles.section, fadeStyle(nazaryLinkAnim)]}>
            <Pressable
              style={[styles.socialBanner, shadows.soft]}
              onPress={() => navigation?.navigate?.('PlannerSettings')}
            >
              <View style={styles.socialBannerIcon}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.socialBannerTitle}>Add your social media links</Text>
                <Text style={styles.socialBannerText}>
                  Travelers verify planners by checking their Nazary link in Instagram or TikTok bio. Add your links so travelers can trust and book with you easily.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Your Trips */}
        <Animated.View ref={tripsRef} collapsable={false} style={[styles.section, fadeStyle(tripsSectionAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Trips</Text>
            <Pressable onPress={() => navigation?.navigate?.('ManageTrips')}>
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </View>
          {trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="map-outline" size={32} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No trips yet</Text>
            </View>
          ) : (
            trips.map((trip) => {
              const statusStyle = statusColors[trip.status] ?? statusColors.draft;
              const total = trip.totalSeats ?? trip.total_seats ?? 0;
              const left = trip.seatsLeft ?? trip.seats_left ?? 0;
              const booked = total - left;
              const fillPercentage = total > 0 ? (booked / total) * 100 : 0;
              const estRevenue = booked * (trip.price ?? 0);
              const sd = trip.startDate ?? trip.start_date ?? '';
              const dateLabel = sd ? new Date(sd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

              return (
                <Pressable
                  key={trip.id}
                  onPress={() => navigation?.navigate?.('TripDetails', { tripId: trip.id })}
                >
                  <Animated.View style={[styles.tripCard, shadows.soft]}>
                    <View style={styles.tripTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tripTitle}>{trip.title}</Text>
                        {dateLabel ? (
                          <Text style={styles.tripDate}>
                            <Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} /> Starts {dateLabel}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tripBottom}>
                      <View style={styles.tripStat}>
                        <Text style={styles.tripStatValue}>{booked}/{total}</Text>
                        <Text style={styles.tripStatLabel}>Booked</Text>
                      </View>
                      <View style={styles.tripStat}>
                        <Text style={styles.tripStatValue}>PKR {formatRevenue(estRevenue)}</Text>
                        <Text style={styles.tripStatLabel}>Revenue</Text>
                      </View>
                      <View style={[styles.progressBarContainer, { flex: 1 }]}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${Math.min(fillPercentage, 100)}%`, backgroundColor: fillPercentage >= 100 ? colors.success : colors.primary }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(fillPercentage)}% filled</Text>
                      </View>
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        {/* Recent Bookings */}
        <Animated.View style={[styles.section, fadeStyle(bookingsSectionAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <Pressable onPress={() => navigation?.navigate?.('BookingRequests')}>
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </View>
          {bookingTripGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={colors.outlineVariant} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          ) : (
            bookingTripGroups.map((group) => (
              <Pressable
                key={group.tripId}
                onPress={() => navigation?.navigate?.('TripDetails', { tripId: group.tripId })}
              >
                <Animated.View style={[styles.bookingCard, shadows.soft]}>
                  {group.tripHeroImage ? (
                    <Image source={{ uri: group.tripHeroImage }} style={styles.bookingHero} />
                  ) : (
                    <LinearGradient
                      colors={[colors.primaryTint, colors.surfaceContainerHigh]}
                      style={[styles.bookingHero, styles.bookingHeroPlaceholder]}
                    >
                      <Ionicons name="map-outline" size={22} color={colors.primary} />
                    </LinearGradient>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingName} numberOfLines={1}>{group.tripTitle}</Text>
                    {group.tripLocation ? (
                      <Text style={styles.bookingTrip} numberOfLines={1}>{group.tripLocation}</Text>
                    ) : null}
                    <View style={styles.bookingAvatarRow}>
                      <AvatarGroup avatars={group.avatars} max={4} size={24} />
                    </View>
                  </View>
                  {group.pendingCount > 0 && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{group.pendingCount}</Text>
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <TourOverlay steps={tourSteps} visible={tourVisible} onComplete={completeTour} />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingTop: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  headerTitle: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  headerSubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing['2xl'] },
  statCard: { width: '47.5%', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  statValue: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface, marginBottom: 2 },
  statLabel: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.sm },
  growthText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.success },
  section: { marginBottom: spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface },
  seeAll: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.primary, letterSpacing: 1 },
  tripCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.md },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  tripTitle: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginBottom: 4 },
  tripDate: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 0.3, textTransform: 'capitalize' },
  tripBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  tripStat: { alignItems: 'center' },
  tripStatValue: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface },
  tripStatLabel: { fontFamily: 'Inter_300Light', fontSize: 9, color: colors.onSurfaceVariant, marginTop: 2 },
  progressBarContainer: { marginLeft: spacing.sm },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontFamily: 'Inter_300Light', fontSize: 9, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'right' },
  bookingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.sm, gap: spacing.md },
  bookingHero: { width: 60, height: 60, borderRadius: radii.lg },
  bookingHeroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bookingName: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurface },
  bookingTrip: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  bookingAvatarRow: { marginTop: spacing.sm },
  pendingBadge: { backgroundColor: colors.warning, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#fff' },
  emptyCard: { alignItems: 'center', paddingVertical: spacing['2xl'], marginHorizontal: spacing.xl, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, gap: spacing.sm },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  nazaryLinkCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginHorizontal: spacing.xl },
  nazaryLinkHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  nazaryLinkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nazaryLinkTitle: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface },
  nazaryLinkSubtitle: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  nazaryLinkUrlContainer: { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  nazaryLinkUrl: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  nazaryLinkActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  nazaryLinkButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full },
  nazaryLinkButtonText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  nazaryLinkHint: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, lineHeight: 16 },
  socialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
  },
  socialBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBannerTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  socialBannerText: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
});
