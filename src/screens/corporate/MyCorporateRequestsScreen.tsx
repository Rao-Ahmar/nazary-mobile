import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { corporateTripsApi } from '../../api/corporateTrips';

export function MyCorporateRequestsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = useMemo(() => ({
    pending: { color: colors.warning, bg: colors.warningLight, icon: 'time-outline', label: 'Pending' },
    in_review: { color: colors.primary, bg: colors.primaryTint, icon: 'eye-outline', label: 'In Review' },
    arranged: { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle-outline', label: 'Trip Ready' },
    rejected: { color: colors.error, bg: colors.errorContainer, icon: 'close-circle-outline', label: 'Rejected' },
  }), [colors]);

  const fadeIn = useRef(new Animated.Value(0)).current;

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await corporateTripsApi.getMyRequests();
      const data = res.data?.data || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    Animated.timing(fadeIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const plannerName = item.preferred_planner?.name || item.preferredPlannerName;

    return (
      <Animated.View style={[styles.card, shadows.card, { opacity: fadeIn, transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.created_at || item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.cardRow}>
          <Ionicons name="business-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>{item.company_name || item.companyName}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="people-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>{item.estimated_people || item.estimatedPeople} people</Text>
        </View>
        {plannerName && (
          <View style={styles.cardRow}>
            <Ionicons name="person-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.cardValue}>Planner: {plannerName}</Text>
          </View>
        )}

        {item.status === 'arranged' && (item.linked_trip_id || item.linkedTripId) && (
          <Pressable style={styles.viewTripButton} onPress={() => (navigation as any).navigate('TripDetails', { tripId: item.linked_trip_id || item.linkedTripId })}>
            <Text style={styles.viewTripText}>View Your Trip</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>My Corporate Requests</Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={colors.outline} />
              <Text style={styles.emptyTitle}>No corporate requests yet</Text>
              <Text style={styles.emptyText}>Submit your first corporate trip request!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  dateText: { ...typography.bodySm, color: colors.outline },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardValue: { ...typography.bodyMd, color: colors.onSurface },
  viewTripButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, height: 44, borderRadius: radii.md, backgroundColor: colors.primaryTint },
  viewTripText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary },
  emptyState: { alignItems: 'center', paddingTop: spacing['4xl'] },
  emptyTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginTop: spacing.lg },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' },
});
