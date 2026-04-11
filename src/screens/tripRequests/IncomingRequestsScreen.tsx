import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { useTripRequestStore } from '../../store/tripRequestStore';

export function IncomingRequestsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { incomingRequests, acceptRequest, rejectRequest } = useTripRequestStore();

  const anims = useRef(incomingRequests.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 80);
    });
  }, []);

  const fadeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Incoming Requests</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                        Alert.alert('Accept Request', `Accept trip request to ${req.destination}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Accept', onPress: () => acceptRequest(req.id) },
                        ]);
                      }}
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Alert.alert('Reject Request', `Reject trip request to ${req.destination}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Reject', style: 'destructive', onPress: () => rejectRequest(req.id) },
                        ]);
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
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
