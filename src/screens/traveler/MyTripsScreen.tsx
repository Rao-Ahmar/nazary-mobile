import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { useTripRequestStore } from '../../store/tripRequestStore';
import { StatusBadge } from '../../components/StatusBadge';
import { TourOverlay, useTourGuide } from '../../components/tour';

export function MyTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { myRequests, isLoading, fetchMyRequests } = useTripRequestStore();
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
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyRequests();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>My Trips</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* My Requests Section */}
        <View ref={requestsRef} collapsable={false} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Requests</Text>
            <Pressable onPress={() => navigation.navigate('MyTripRequests')}>
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </View>

          {myRequests.length === 0 ? (
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
          <View style={styles.placeholder}>
            <Ionicons name="map-outline" size={48} color={colors.outlineVariant} />
            <Text style={styles.placeholderText}>Your booked trips will appear here</Text>
          </View>
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
  requestCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.sm },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  requestDest: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface },
  requestDates: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  requestPlanner: { fontFamily: 'Inter_300Light', fontSize: 12, color: colors.onSurfaceVariant },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing['3xl'] },
  placeholderText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
