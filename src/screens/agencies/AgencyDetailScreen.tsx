import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';
import { plannersApi } from '../../api/planners';
import { reviewsApi } from '../../api/reviews';
import type { Agency, Trip, PlannerReview } from '../../types';

const { width } = Dimensions.get('window');
const TRIP_CARD_WIDTH = width * 0.7;

export function AgencyDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { agencyId, plannerId } = route.params ?? {};
  const id = agencyId || plannerId;

  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reviews, setReviews] = useState<PlannerReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [agencyRes, tripsRes, reviewsRes] = await Promise.all([
        plannersApi.getById(id),
        plannersApi.getTrips(id, 1).catch(() => null),
        reviewsApi.getPlannerReviews(id, 1).catch(() => null),
      ]);

      const agencyData = (agencyRes.data as any)?.data ?? agencyRes.data;
      setAgency(agencyData);

      if (tripsRes) {
        const tripsData = Array.isArray(tripsRes.data) ? tripsRes.data : (tripsRes.data as any)?.data ?? [];
        setTrips(tripsData);
      }

      if (reviewsRes) {
        const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : (reviewsRes.data as any)?.data ?? [];
        setReviews(reviewsData);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [id]);

  const hasMounted = useRef(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Silently refetch when returning from WriteReview screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (hasMounted.current) {
        // Refetch without showing loading spinner
        Promise.all([
          plannersApi.getById(id),
          reviewsApi.getPlannerReviews(id, 1).catch(() => null),
        ]).then(([agencyRes, reviewsRes]) => {
          const agencyData = (agencyRes.data as any)?.data ?? agencyRes.data;
          setAgency(agencyData);
          if (reviewsRes) {
            const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : (reviewsRes.data as any)?.data ?? [];
            setReviews(reviewsData);
          }
        }).catch(() => {});
      }
      hasMounted.current = true;
    });
    return unsubscribe;
  }, [navigation, id]);

  useEffect(() => {
    if (!loading && agency) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, agency]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Agency</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!agency) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Agency</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.outlineVariant} />
          <Text style={styles.errorText}>Agency not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Agency</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        >
          {/* Cover Photo Hero */}
          {agency.coverPhoto ? (
            <View style={styles.coverPhotoContainer}>
              <Image source={{ uri: agency.coverPhoto }} style={styles.coverPhoto} />
              <View style={styles.avatarOverCover}>
                <Image
                  source={{
                    uri: agency.agencyLogo || agency.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                  }}
                  style={styles.avatarOnCover}
                />
              </View>
            </View>
          ) : null}

          {/* Profile */}
          <View style={[styles.profileSection, agency.coverPhoto && { marginTop: 30 }]}>
            {!agency.coverPhoto && (
              <Image
                source={{
                  uri: agency.agencyLogo || agency.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                }}
                style={styles.avatar}
              />
            )}
            <View style={styles.nameRow}>
              <Text style={styles.name}>{agency.agencyName || agency.name}</Text>
              {/* TODO: Re-enable verified badge when admin verification is in place
              {agency.verified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 6 }} />
              )} */}
            </View>
            {agency.name && agency.agencyName && (
              <Text style={styles.ownerName}>{agency.name}</Text>
            )}
            {agency.agencyTagline ? <Text style={styles.tagline}>{agency.agencyTagline}</Text> : null}
            {Number(agency.averageRating) > 0 && (
              <>
                <StarRating rating={Math.round(Number(agency.averageRating))} size={20} style={{ marginTop: spacing.md }} />
                <Text style={styles.ratingText}>{Number(agency.averageRating).toFixed(1)} rating</Text>
              </>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{agency.totalTrips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{agency.yearsExperience ? `${agency.yearsExperience}y` : '—'}</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{Number(agency.averageRating) > 0 ? Number(agency.averageRating).toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Bio / About */}
          {agency.bio ? (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{agency.bio}</Text>
            </View>
          ) : null}

          {/* Nazary Public URL */}
          {(agency as any).nazaryUrl || (agency as any).nazary_url ? (
            <View style={styles.nazaryUrlCard}>
              <Ionicons name="link-outline" size={16} color={colors.primary} />
              <Text style={styles.nazaryUrlText} numberOfLines={1}>
                {(agency as any).nazaryUrl ?? (agency as any).nazary_url}
              </Text>
            </View>
          ) : null}

          {/* Social Links */}
          {(() => {
            const links: { url?: string; icon: keyof typeof Ionicons.glyphMap }[] = [
              { url: agency.instagramUrl, icon: 'logo-instagram' },
              { url: agency.youtubeUrl, icon: 'logo-youtube' },
              { url: agency.tiktokUrl, icon: 'logo-tiktok' },
              { url: agency.twitterUrl, icon: 'logo-twitter' },
              { url: agency.websiteUrl, icon: 'globe-outline' },
            ];
            const activeLinks = links.filter((l) => l.url);
            const hasInstagramOrTiktok = !!(agency.instagramUrl || agency.tiktokUrl);
            const nUrl = (agency as any).nazaryUrl ?? (agency as any).nazary_url;

            if (activeLinks.length === 0) {
              return (
                <View style={styles.noSocialWarning}>
                  <View style={styles.noSocialIconRow}>
                    <Ionicons name="warning-outline" size={20} color={colors.warning} />
                    <Text style={styles.noSocialTitle}>No social media linked</Text>
                  </View>
                  <Text style={styles.noSocialText}>
                    This planner has not added any social media links.{nUrl
                      ? ` Verify them by checking that their Instagram or TikTok bio contains their Nazary link before sending any payment.`
                      : ` Please verify this planner through other means before sending any payment.`}
                  </Text>
                  {nUrl ? (
                    <View style={styles.noSocialLinkBox}>
                      <Ionicons name="link-outline" size={14} color={colors.primary} />
                      <Text style={styles.noSocialLinkText} selectable>{nUrl}</Text>
                    </View>
                  ) : null}
                </View>
              );
            }

            return (
              <>
                {!hasInstagramOrTiktok && nUrl ? (
                  <View style={styles.noSocialWarning}>
                    <View style={styles.noSocialIconRow}>
                      <Ionicons name="warning-outline" size={20} color={colors.warning} />
                      <Text style={styles.noSocialTitle}>Instagram / TikTok not linked</Text>
                    </View>
                    <Text style={styles.noSocialText}>
                      This planner has not added Instagram or TikTok. Verify them by checking that their social profile bio contains their Nazary link before sending any payment.
                    </Text>
                    <View style={styles.noSocialLinkBox}>
                      <Ionicons name="link-outline" size={14} color={colors.primary} />
                      <Text style={styles.noSocialLinkText} selectable>{nUrl}</Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.socialRow}>
                  {activeLinks.map((link) => (
                    <Pressable
                      key={link.icon}
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(link.url!)}
                    >
                      <Ionicons name={link.icon} size={20} color={colors.onSurface} />
                    </Pressable>
                  ))}
                </View>
              </>
            );
          })()}

          {/* Active Trips */}
          {trips.length > 0 && (
            <View style={styles.tripsSection}>
              <Text style={styles.sectionTitle}>Active Trips</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tripsScroll}
              >
                {trips.map((trip) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
                    style={[styles.tripCard, shadows.soft]}
                  >
                    <Image source={{ uri: trip.heroImage }} style={styles.tripImage} />
                    <View style={styles.tripInfo}>
                      <Text style={styles.tripTitle} numberOfLines={1}>{trip.title}</Text>
                      <Text style={styles.tripLocation} numberOfLines={1}>{trip.location}</Text>
                      <View style={styles.tripMeta}>
                        <Text style={styles.tripPrice}>
                          {trip.currency || 'PKR'} {trip.price?.toLocaleString()}
                        </Text>
                        <Text style={styles.tripSeats}>{trip.seatsLeft} seats left</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('WriteReview', {
                    type: 'planner',
                    targetId: id,
                    targetName: agency.agencyName || agency.name,
                  })
                }
              >
                <Text style={styles.writeReview}>Write a Review</Text>
              </Pressable>
            </View>
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  name={r.name}
                  avatar={r.avatar}
                  rating={r.rating}
                  text={r.text}
                  date={r.date}
                />
              ))
            ) : (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            )}
          </View>

          {/* Request a Custom Trip */}
          <Pressable
            style={styles.requestButton}
            onPress={() => navigation.navigate('CreateTripRequest', { plannerId: id, plannerName: agency.agencyName || agency.name })}
          >
            <Ionicons name="paper-plane-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.requestButtonText}>Request a Custom Trip</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.md },
  scrollContent: { paddingHorizontal: spacing.xl },

  // Cover photo
  coverPhotoContainer: { marginHorizontal: -spacing.xl, marginBottom: spacing.md, position: 'relative' },
  coverPhoto: { width: '100%', height: 180, backgroundColor: colors.surfaceContainerHigh },
  avatarOverCover: { position: 'absolute', bottom: -40, alignSelf: 'center' },
  avatarOnCover: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.surface },

  // Profile
  profileSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface },
  ownerName: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  tagline: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  ratingText: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.xs },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface },
  statLabel: { fontFamily: 'Inter_300Light', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 },

  // Bio
  bioSection: { marginBottom: spacing['2xl'] },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: spacing.md },
  bioText: { ...typography.bodyMd, color: colors.onSurfaceVariant },

  // Nazary URL
  nazaryUrlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  nazaryUrlText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },

  // No social warning
  noSocialWarning: {
    backgroundColor: colors.warningLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  noSocialIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  noSocialTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '600',
  },
  noSocialText: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  noSocialLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  noSocialLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.primary,
    flex: 1,
  },

  // Social links
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing['2xl'] },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trips
  tripsSection: { marginBottom: spacing['2xl'] },
  tripsScroll: { gap: spacing.md },
  tripCard: {
    width: TRIP_CARD_WIDTH,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  tripImage: { width: '100%', height: TRIP_CARD_WIDTH * 0.55, backgroundColor: colors.surfaceContainerHigh },
  tripInfo: { padding: spacing.md },
  tripTitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface },
  tripLocation: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  tripMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  tripPrice: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  tripSeats: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },

  // Reviews
  reviewsSection: { marginBottom: spacing['2xl'] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  writeReview: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  noReviews: { ...typography.bodySm, color: colors.onSurfaceVariant },

  // Request button
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  requestButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.onPrimary,
  },
});
