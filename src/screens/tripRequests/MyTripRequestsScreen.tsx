import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { useTripRequestStore } from '../../store/tripRequestStore';

export function MyTripRequestsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const myRequests = useTripRequestStore((s) => s.myRequests);

  const anims = useRef(myRequests.map(() => new Animated.Value(0))).current;
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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {myRequests.length === 0 ? (
          <EmptyState icon="document-text-outline" title="No Requests Yet" message="Send a custom trip request to a planner" />
        ) : (
          myRequests.map((req, i) => (
            <Animated.View key={req.id} style={fadeStyle(anims[i] || new Animated.Value(1))}>
              <Pressable
                onPress={() => navigation.navigate('TripRequestDetail', { requestId: req.id })}
                style={[styles.card, shadows.soft]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destination}>{req.destination}</Text>
                    <Text style={styles.dates}>
                      <Ionicons name="calendar-outline" size={11} color={colors.onSurfaceVariant} /> {req.startDate} - {req.endDate}
                    </Text>
                  </View>
                  <StatusBadge status={req.status} />
                </View>
                <View style={styles.cardBottom}>
                  <Image source={{ uri: req.plannerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.plannerAvatar} />
                  <Text style={styles.plannerName}>{req.plannerName}</Text>
                  <Text style={styles.seats}>{req.seats} seats</Text>
                  {req.budget && <Text style={styles.budget}>PKR {req.budget.toLocaleString()}</Text>}
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  destination: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginBottom: 4 },
  dates: { ...typography.bodySm, color: colors.onSurfaceVariant },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  plannerAvatar: { width: 24, height: 24, borderRadius: 12 },
  plannerName: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurface, flex: 1 },
  seats: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  budget: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.primary },
});
