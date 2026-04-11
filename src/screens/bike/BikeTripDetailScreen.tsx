import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { useBikeStore } from '../../store/bikeStore';

const { width } = Dimensions.get('window');

export function BikeTripDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;
  const trip = useBikeStore((s) => s.bikeTrips.find((t) => t.id === tripId));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  if (!trip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ padding: spacing.xl, ...typography.titleMd }}>Trip not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: trip.heroImage }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.heroGradient}>
            <View style={styles.bikeBadge}>
              <Ionicons name="bicycle" size={14} color="#fff" />
              <Text style={styles.bikeBadgeText}>Bike Trip</Text>
            </View>
            <Text style={styles.heroTitle}>{trip.title}</Text>
            <Text style={styles.heroSubtitle}>{trip.subtitle}</Text>
          </LinearGradient>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { top: insets.top + spacing.sm }]}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.metaValue}>{trip.duration}</Text>
              <Text style={styles.metaLabel}>Duration</Text>
            </View>
            <View style={styles.metaCard}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.metaValue}>{trip.seatsLeft}/{trip.totalSeats}</Text>
              <Text style={styles.metaLabel}>Seats Left</Text>
            </View>
            <View style={styles.metaCard}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.metaValue}>{trip.rating}</Text>
              <Text style={styles.metaLabel}>{trip.reviewCount} reviews</Text>
            </View>
          </View>

          <View style={[styles.hostCard, shadows.soft]}>
            <Image source={{ uri: trip.host.avatar }} style={styles.hostAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hostName}>{trip.host.name}</Text>
              <Text style={styles.hostGuild}>{trip.host.guild}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('PlannerPublicProfile', { plannerId: trip.host.id })}>
              <Ionicons name="chevron-forward" size={20} color={colors.outline} />
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{trip.description}</Text>

          {trip.highlights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {trip.highlights.map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </>
          )}

          {trip.itinerary.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Itinerary</Text>
              {trip.itinerary.map((day, i) => (
                <View key={i} style={styles.itineraryRow}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>Day {day.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itineraryTitle}>{day.title}</Text>
                    <Text style={styles.itineraryDesc}>{day.desc}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View>
          <Text style={styles.price}>PKR {trip.price.toLocaleString()}</Text>
          <Text style={styles.pricePer}>per rider</Text>
        </View>
        <Pressable style={styles.bookButton}>
          <LinearGradient colors={['#0058bc', '#0070eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookGradient}>
            <Text style={styles.bookText}>Join Ride</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  heroContainer: { position: 'relative' },
  heroImage: { width, height: width * 0.65 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, paddingTop: spacing['3xl'] },
  bikeBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.full, marginBottom: spacing.sm },
  bikeBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#fff' },
  heroTitle: { fontFamily: 'Manrope_300Light', fontSize: 28, color: '#fff', letterSpacing: -0.5 },
  heroSubtitle: { fontFamily: 'Inter_300Light', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  backButton: { position: 'absolute', left: spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  metaCard: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg },
  metaValue: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginTop: spacing.xs },
  metaLabel: { fontFamily: 'Inter_300Light', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 },
  hostCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md },
  hostName: { fontFamily: 'Manrope_400Regular', fontSize: 15, color: colors.onSurface },
  hostGuild: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: spacing.md },
  description: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.xl },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  highlightText: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  itineraryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  dayBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.full, alignSelf: 'flex-start' },
  dayText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#fff' },
  itineraryTitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface },
  itineraryDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, backgroundColor: colors.surfaceContainerLowest, borderTopWidth: 0 },
  price: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface },
  pricePer: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  bookButton: { borderRadius: radii.xl, overflow: 'hidden' },
  bookGradient: { paddingHorizontal: spacing['2xl'], height: 50, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  bookText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#fff' },
});
