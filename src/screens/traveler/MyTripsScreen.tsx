import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { useTripRequestStore } from '../../store/tripRequestStore';
import { StatusBadge } from '../../components/StatusBadge';

export function MyTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const myRequests = useTripRequestStore((s) => s.myRequests);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>My Trips</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* My Requests Section */}
        <View style={styles.section}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booked Trips</Text>
          <View style={styles.placeholder}>
            <Ionicons name="map-outline" size={48} color={colors.outlineVariant} />
            <Text style={styles.placeholderText}>Your booked trips will appear here</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
