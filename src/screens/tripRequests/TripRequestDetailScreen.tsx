import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';
import { useTripRequestStore } from '../../store/tripRequestStore';
import { useAuthStore } from '../../store';

export function TripRequestDetailScreen({ navigation, route }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const insets = useSafeAreaInsets();
  const { requestId } = route.params;
  const user = useAuthStore((s) => s.user);
  const { myRequests, incomingRequests, cancelRequest, acceptRequest, rejectRequest } = useTripRequestStore();

  const request = [...myRequests, ...incomingRequests].find((r) => r.id === requestId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  if (!request) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Request not found</Text>
      </View>
    );
  }

  const isMyRequest = String(request.travelerId) === String(user?.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Request Detail</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={styles.statusRow}>
            <Text style={styles.destination}>{request.destination}</Text>
            <StatusBadge status={request.status} />
          </View>

          <View style={[styles.infoCard, shadows.soft]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>Dates</Text>
              <Text style={styles.infoValue}>{request.startDate} - {request.endDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>Seats</Text>
              <Text style={styles.infoValue}>{request.seats}</Text>
            </View>
            {request.category && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{request.category}</Text>
              </View>
            )}
            {request.budget && (
              <View style={styles.infoRow}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>PKR {request.budget.toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={[styles.personCard, shadows.soft]}>
            <Image source={{ uri: isMyRequest ? request.plannerAvatar : request.travelerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.personAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personLabel}>{isMyRequest ? 'Planner' : 'Traveler'}</Text>
              <Text style={styles.personName}>{isMyRequest ? request.plannerName : request.travelerName}</Text>
            </View>
            {request.status === 'accepted' && (
              <View style={styles.phoneContainer}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
                <Text style={styles.phoneText}>{isMyRequest ? request.plannerPhone : request.travelerPhone}</Text>
              </View>
            )}
          </View>

          {request.note && (
            <View style={[styles.noteCard, shadows.soft]}>
              <Text style={styles.noteLabel}>Note</Text>
              <Text style={styles.noteText}>{request.note}</Text>
            </View>
          )}

          {request.status === 'accepted' && (
            <View style={styles.contactInfo}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>Contact information is now visible since the request was accepted.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {request.status === 'pending' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          {isMyRequest ? (
            <Pressable
              onPress={() => Alert.alert('Cancel Request', 'Are you sure?', [
                { text: 'No', style: 'cancel' },
                { text: 'Cancel Request', style: 'destructive', onPress: async () => { await cancelRequest(request.id); navigation.goBack(); } },
              ])}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel Request</Text>
            </Pressable>
          ) : (
            <View style={styles.actionRow}>
              <Pressable onPress={async () => { await acceptRequest(request.id); navigation.goBack(); }} style={[styles.actionBtn, styles.acceptBtn]}>
                <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                <Text style={styles.actionBtnText}>Accept</Text>
              </Pressable>
              <Pressable onPress={async () => { await rejectRequest(request.id); navigation.goBack(); }} style={[styles.actionBtn, styles.rejectBtn]}>
                <Ionicons name="close" size={18} color={colors.onPrimary} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  title: { ...typography.titleLg, paddingHorizontal: spacing.xl },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  destination: { fontFamily: 'Manrope_300Light', fontSize: 28, color: colors.onSurface, letterSpacing: -0.5 },
  infoCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginLeft: spacing.md, flex: 1 },
  infoValue: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface },
  personCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  personAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  personLabel: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  personName: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginTop: 2 },
  phoneContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full },
  phoneText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  noteCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  noteLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  noteText: { ...typography.bodyMd, color: colors.onSurface },
  contactInfo: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.primaryTint, borderRadius: radii.xl, padding: spacing.lg },
  contactText: { ...typography.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  cancelButton: { height: 56, borderRadius: radii.xl, backgroundColor: colors.errorContainer, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.error },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, height: 56, borderRadius: radii.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  acceptBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  actionBtnText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
});
