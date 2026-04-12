import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ImageBackground, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Colors, type Shadows } from '../../theme';
import { typography, spacing, radii } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { useBikeStore } from '../../store/bikeStore';

export function BikeTripsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { bikeTrips, isPremiumUnlocked } = useBikeStore();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const anims = useRef(bikeTrips.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!isPremiumUnlocked) {
      navigation.replace('PremiumPaywall');
      return;
    }
    anims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 120);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Bike Trips</Text>
        <Pressable onPress={() => navigation.navigate('BikeRiders')}>
          <Ionicons name="people-outline" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {bikeTrips.length === 0 ? (
          <EmptyState icon="bicycle-outline" title="No Bike Trips" message="Premium bike trips coming soon!" />
        ) : (
          bikeTrips.map((trip, i) => (
            <Animated.View key={trip.id} style={[shadows.card, { opacity: anims[i] || 1, transform: [{ translateY: (anims[i] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <Pressable onPress={() => navigation.navigate('BikeTripDetail', { tripId: trip.id })}>
                <ImageBackground source={{ uri: trip.heroImage }} style={styles.cardImage} imageStyle={{ borderRadius: radii.xl }} resizeMode="cover">
                  <View style={styles.cardBadges}>
                    <View style={styles.bikeBadge}>
                      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                      <Ionicons name="bicycle" size={14} color={colors.primary} />
                      <Text style={styles.bikeBadgeText}>Bike Trip</Text>
                    </View>
                  </View>
                  <View style={styles.cardOverlay}>
                    <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{trip.title}</Text>
                      <Text style={styles.cardLocation}>
                        <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} /> {trip.location}
                      </Text>
                      <View style={styles.cardMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={colors.onSurfaceVariant} />
                          <Text style={styles.metaText}>{trip.duration}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={14} color={colors.onSurfaceVariant} />
                          <Text style={styles.metaText}>{trip.seatsLeft} seats left</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={14} color={colors.star} />
                          <Text style={styles.metaText}>{trip.rating}</Text>
                        </View>
                      </View>
                      <View style={styles.tagRow}>
                        {trip.tags.map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            </Animated.View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  cardImage: { height: 300, justifyContent: 'space-between', marginBottom: spacing.xl },
  cardBadges: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.lg },
  bikeBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radii.full, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 6 },
  bikeBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.primary },
  cardOverlay: { borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl, overflow: 'hidden' },
  cardContent: { padding: spacing.lg },
  cardTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: 4 },
  cardLocation: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  cardMeta: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.onSurfaceVariant },
  tagRow: { flexDirection: 'row', gap: spacing.sm },
  tag: { backgroundColor: colors.tagBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  tagText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
});
