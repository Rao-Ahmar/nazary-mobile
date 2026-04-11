import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { useArrangementStore } from '../../store/arrangementStore';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending: { color: '#f59e0b', bg: '#fffbeb', icon: 'time-outline', label: 'Pending' },
  in_review: { color: colors.primary, bg: 'rgba(0,88,188,0.06)', icon: 'eye-outline', label: 'In Review' },
  arranged: { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle-outline', label: 'Trip Ready' },
  rejected: { color: colors.error, bg: colors.errorContainer, icon: 'close-circle-outline', label: 'Rejected' },
};

export function MyArrangementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { arrangements, fetchArrangements, isLoading } = useArrangementStore();

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fetchArrangements();
    Animated.timing(fadeIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
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
          <Ionicons name="location-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>{item.preferred_destination || item.preferredDestination || 'Surprise me!'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>{item.travel_dates || item.travelDates}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="people-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>{item.group_size || item.groupSize} people</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="wallet-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={styles.cardValue}>PKR {(item.budget_min || item.budgetMin)?.toLocaleString()} - {(item.budget_max || item.budgetMax)?.toLocaleString()}</Text>
        </View>

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
        <Text style={styles.headerTitle}>My Arrangements</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={arrangements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>No arrangements yet</Text>
            <Text style={styles.emptyText}>Submit your first "Arrange a Trip for Me" request!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  viewTripButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, height: 44, borderRadius: radii.md, backgroundColor: 'rgba(0,88,188,0.06)' },
  viewTripText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary },
  emptyState: { alignItems: 'center', paddingTop: spacing['4xl'] },
  emptyTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginTop: spacing.lg },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' },
});
