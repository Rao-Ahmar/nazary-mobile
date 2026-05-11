import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { useTripRequestStore } from '../../store/tripRequestStore';
import { useAlert } from '../../components/ThemedAlert';
import { TourOverlay, useTourGuide } from '../../components/tour';

export function IncomingRequestsScreen({ navigation }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();

  const insets = useSafeAreaInsets();
  const { incomingRequests, fetchIncoming, acceptRequest, rejectRequest } = useTripRequestStore();

  // Tour guide
  const titleRef = useRef<View>(null);
  const cardsRef = useRef<View>(null);
  const { tourVisible, tourSteps, completeTour } = useTourGuide(
    'planner_requests',
    [titleRef, cardsRef],
    [
      { id: 'title', title: 'Trip Requests', description: 'Travelers send you custom trip requests. Review and respond here', icon: 'document-text' },
      { id: 'cards', title: 'Accept or Reject', description: 'Tap any request to view details, then accept or reject it', icon: 'checkmark-circle' },
    ],
  );

  useEffect(() => {
    fetchIncoming();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchIncoming();
    });
    return unsubscribe;
  }, [navigation]);

  const anims = useRef(incomingRequests.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 80);
    });
  }, [incomingRequests.length]);

  const fadeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View ref={titleRef} collapsable={false}>
        <Text style={styles.title}>Incoming Requests</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View ref={cardsRef} collapsable={false}>
        {incomingRequests.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No Requests" message="Custom trip requests from travelers will appear here" />
        ) : (
          incomingRequests.map((req, i) => (
            <Animated.View key={req.id} style={fadeStyle(anims[i] || new Animated.Value(1))}>
              <Pressable
                onPress={() => navigation.navigate('TripRequestDetail', { requestId: req.id })}
                style={[styles.card, shadows.soft]}
              >
                <View style={styles.cardTop}>
                  <Image source={{ uri: req.travelerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.avatar} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.travelerName}>{req.travelerName}</Text>
                    <Text style={styles.destination}>{req.destination}</Text>
                    <Text style={styles.dates}>{req.startDate} - {req.endDate} | {req.seats} seats</Text>
                  </View>
                  <StatusBadge status={req.status} />
                </View>
                {req.note && <Text style={styles.note} numberOfLines={2}>{req.note}</Text>}
                {req.status === 'pending' && (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => {
                        alert.show({ title: 'Accept Request', message: `Accept trip request to ${req.destination}?`, type: 'info', buttons: [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Accept', onPress: () => acceptRequest(req.id) },
                        ] });
                      }}
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        alert.show({ title: 'Reject Request', message: `Reject trip request to ${req.destination}?`, type: 'warning', buttons: [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Reject', style: 'destructive', onPress: () => rejectRequest(req.id) },
                        ] });
                      }}
                      style={[styles.actionButton, styles.rejectButton]}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                      <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          ))
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
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  travelerName: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface },
  destination: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary, marginTop: 2 },
  dates: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  note: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: 40, borderRadius: radii.md },
  acceptButton: { backgroundColor: colors.successLight },
  rejectButton: { backgroundColor: colors.errorContainer },
  actionText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
