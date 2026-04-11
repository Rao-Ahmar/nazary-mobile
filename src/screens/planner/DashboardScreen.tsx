import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { agencyStats, agencyTrips, recentBookings } from '../../data/mockData';
import { NotificationBell } from '../../components/NotificationBell';

function useStaggeredFadeIn(count: number, baseDelay = 200, stagger = 70) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    const timers = anims.map((anim, i) =>
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, baseDelay + i * stagger),
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return anims;
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

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: colors.successLight, text: colors.success },
  draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  completed: { bg: 'rgba(0,88,188,0.08)', text: colors.primary },
};

export function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const headerAnim = useFadeIn(50);
  const stat1Anim = useFadeIn(100);
  const stat2Anim = useFadeIn(150);
  const stat3Anim = useFadeIn(200);
  const stat4Anim = useFadeIn(250);
  const tripsSectionAnim = useFadeIn(300);
  const tripAnims = useStaggeredFadeIn(agencyTrips.length, 350, 60);
  const bookingsSectionAnim = useFadeIn(550);
  const bookingAnims = useStaggeredFadeIn(recentBookings.length, 600, 60);

  const fadeStyle = (anim: Animated.Value, translateDistance = 20) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [translateDistance, 0] }) }],
  });

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

        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat1Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,88,188,0.08)' }]}>
              <Ionicons name="trending-up" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>${(agencyStats.totalRevenue / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Revenue</Text>
            <View style={styles.growthBadge}>
              <Ionicons name="arrow-up" size={10} color={colors.success} />
              <Text style={styles.growthText}>{agencyStats.monthlyGrowth}%</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat2Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="compass-outline" size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{agencyStats.activeTrips}</Text>
            <Text style={styles.statLabel}>Active Trips</Text>
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat3Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="people-outline" size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{agencyStats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </Animated.View>
          <Animated.View style={[styles.statCard, shadows.soft, fadeStyle(stat4Anim)]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
              <Ionicons name="star-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{agencyStats.avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.section, fadeStyle(tripsSectionAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Trips</Text>
            <Pressable><Ionicons name="add-circle-outline" size={22} color={colors.primary} /></Pressable>
          </View>
          {agencyTrips.map((trip, index) => {
            const statusStyle = statusColors[trip.status] ?? statusColors.draft;
            const fillPercentage = trip.capacity > 0 ? (trip.bookings / trip.capacity) * 100 : 0;
            return (
              <Animated.View key={trip.id} style={[styles.tripCard, shadows.soft, fadeStyle(tripAnims[index])]}>
                <View style={styles.tripTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    <Text style={styles.tripDate}><Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} /> Starts {trip.startDate}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</Text>
                  </View>
                </View>
                <View style={styles.tripBottom}>
                  <View style={styles.tripStat}>
                    <Text style={styles.tripStatValue}>{trip.bookings}/{trip.capacity}</Text>
                    <Text style={styles.tripStatLabel}>Booked</Text>
                  </View>
                  <View style={styles.tripStat}>
                    <Text style={styles.tripStatValue}>${(trip.revenue / 1000).toFixed(1)}k</Text>
                    <Text style={styles.tripStatLabel}>Revenue</Text>
                  </View>
                  <View style={[styles.progressBarContainer, { flex: 1 }]}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${fillPercentage}%`, backgroundColor: fillPercentage >= 100 ? colors.success : colors.primary }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(fillPercentage)}% filled</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.section, fadeStyle(bookingsSectionAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <Pressable><Text style={styles.seeAll}>SEE ALL</Text></Pressable>
          </View>
          {recentBookings.map((booking, index) => (
            <Animated.View key={booking.id} style={[styles.bookingCard, shadows.soft, fadeStyle(bookingAnims[index])]}>
              <Image source={{ uri: booking.avatar }} style={styles.bookingAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingName}>{booking.guestName}</Text>
                <Text style={styles.bookingTrip}>{booking.trip}</Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>${booking.amount.toLocaleString()}</Text>
                <View style={[styles.bookingStatus, { backgroundColor: booking.status === 'confirmed' ? colors.successLight : colors.warningLight }]}>
                  <Text style={[styles.bookingStatusText, { color: booking.status === 'confirmed' ? colors.success : colors.warning }]}>{booking.status}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingTop: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  headerTitle: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  headerSubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing['2xl'] },
  statCard: { width: '47.5%', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  statValue: { fontFamily: 'Manrope_400Regular', fontSize: 24, color: colors.onSurface, marginBottom: 2 },
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
  bookingAvatar: { width: 40, height: 40, borderRadius: 20 },
  bookingName: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurface },
  bookingTrip: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end' },
  bookingAmount: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface, marginBottom: 4 },
  bookingStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  bookingStatusText: { fontFamily: 'Inter_400Regular', fontSize: 9, letterSpacing: 0.3, textTransform: 'capitalize' },
});
