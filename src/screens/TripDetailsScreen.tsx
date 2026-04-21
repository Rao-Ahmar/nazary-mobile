import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../theme';
import { type Colors } from '../theme';
import { tripsApi } from '../api/trips';
import { bookingsApi, type PlannerBooking } from '../api/bookings';
import { useAuthStore } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { useAlert } from '../components/ThemedAlert';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

/* ------------------------------------------------------------------ */
/*  Staggered fade-in helper                                          */
/* ------------------------------------------------------------------ */
function useSectionAnims(count: number) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const timers = anims.map((anim, i) =>
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 100 + i * 100),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return anims;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function TripDetailsScreen({ navigation, route }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const tripId = route?.params?.tripId;
  const { user } = useAuthStore();
  const alert = useAlert();

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [tripBookings, setTripBookings] = useState<PlannerBooking[]>([]);
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);

  const fetchTrip = async () => {
    if (!tripId) {
      setError('No trip ID provided');
      setIsLoading(false);
      return;
    }
    try {
      const response = await tripsApi.getById(tripId);
      const data = (response.data as any)?.data ?? response.data;
      setTrip(data);
    } catch {
      setError('Could not load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  // Re-fetch when screen regains focus (e.g. after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (tripId) fetchTrip();
    });
    return unsubscribe;
  }, [navigation, tripId]);

  // Fetch bookings for this trip (planner view)
  const fetchTripBookings = async () => {
    if (!tripId) return;
    try {
      const res = await bookingsApi.getPlannerBookings({ tripId });
      const raw = res.data;
      const data = Array.isArray(raw) ? raw : (raw as any)?.bookings ?? (raw as any)?.data ?? [];
      setTripBookings(data);
    } catch {
      // silently fail — not a planner or no bookings
    }
  };

  useEffect(() => {
    if (trip && user?.role === 'planner') {
      fetchTripBookings();
    }
  }, [trip, user?.role]);

  const handleConfirmBooking = (booking: PlannerBooking) => {
    const bName = booking.travelerName ?? booking.traveler_name ?? 'Traveler';
    alert.show({ title: 'Confirm Booking', message: `Confirm ${bName}'s booking?`, type: 'info', buttons: [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await bookingsApi.confirmBooking(booking.id);
            setTripBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: 'confirmed' } : b));
          } catch (err: any) {
            alert.show({ title: 'Error', message: err?.response?.data?.error || 'Could not confirm booking', type: 'error' });
          }
        },
      },
    ] });
  };

  const handleRejectBooking = (booking: PlannerBooking) => {
    const bName = booking.travelerName ?? booking.traveler_name ?? 'Traveler';
    alert.show({ title: 'Reject Booking', message: `Reject ${bName}'s booking?`, type: 'warning', buttons: [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingsApi.rejectBooking(booking.id);
            setTripBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
          } catch {
            alert.show({ title: 'Error', message: 'Could not reject booking', type: 'error' });
          }
        },
      },
    ] });
  };

  /* 8 main content sections ---------------------------------------- */
  const sectionAnims = useSectionAnims(8);

  /* Hero parallax --------------------------------------------------- */
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HERO_HEIGHT],
    outputRange: [-50, 0, HERO_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  /* Header bar opacity ---------------------------------------------- */
  const headerBarOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 150, HERO_HEIGHT - 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  /* Helpers to build per-section style ------------------------------ */
  const fadeIn = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  /* Request to Join handler ----------------------------------------- */
  const handleRequestToJoin = async () => {
    if (!trip) return;

    const hostNazaryUrl = host?.nazaryUrl ?? host?.nazary_url;
    const hostInstaUrl = host?.instagramUrl ?? host?.instagram_url;
    const hostTiktokUrl = host?.tiktokUrl ?? host?.tiktok_url;
    const disclaimerParts = [];
    if (hostNazaryUrl && (hostInstaUrl || hostTiktokUrl)) {
      disclaimerParts.push(`\n\nPlease verify this agency is legitimate by checking that their ${hostInstaUrl ? 'Instagram' : ''}${hostInstaUrl && hostTiktokUrl ? ' or ' : ''}${hostTiktokUrl ? 'TikTok' : ''} bio contains their Nazary link (${hostNazaryUrl}). This helps avoid fraud.`);
    }

    alert.show({
      title: 'Request to Join',
      message: `Submit a join request for "${trip.title}"? The agency will review your request. You can also contact them by phone to confirm your booking.${disclaimerParts.join('')}`,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            setIsRequesting(true);
            try {
              await bookingsApi.requestToJoin(tripId);
              setHasRequested(true);
              const hostPhone = host?.phone;
              if (hostPhone) {
                alert.show({
                  title: 'Request Sent!',
                  message: `Your join request has been sent to ${host.name}. Contact them at ${hostPhone} to confirm your booking.`,
                  type: 'success',
                  buttons: [
                    { text: 'OK' },
                    { text: 'Call Now', onPress: () => Linking.openURL(`tel:${hostPhone}`) },
                  ],
                });
              } else {
                alert.show({ title: 'Request Sent!', message: `Your join request has been sent to ${host.name}. They will review it shortly.`, type: 'success' });
              }
            } catch (err: any) {
              const msg = err?.response?.data?.error || 'Could not send join request';
              alert.show({ title: 'Error', message: msg, type: 'error' });
            } finally {
              setIsRequesting(false);
            }
          },
        },
      ],
    });
  };

  /* Call planner handler --------------------------------------------- */
  const handleCallPlanner = () => {
    const hostPhone = host?.phone;
    if (hostPhone) {
      Linking.openURL(`tel:${hostPhone}`);
    }
  };

  /* Update seats left handler (planner only) --------------------------- */
  const handleUpdateSeats = async (delta: number) => {
    if (!trip || isUpdatingSeats) return;
    const currentLeft = trip.seatsLeft ?? trip.seats_left ?? 0;
    const newLeft = currentLeft + delta;
    if (newLeft < 0) return;
    setIsUpdatingSeats(true);
    try {
      const res = await tripsApi.updateSeats(tripId, newLeft);
      const data = (res.data as any)?.data ?? res.data;
      setTrip(data);
    } catch (err: any) {
      alert.show({ title: 'Error', message: err?.response?.data?.error || 'Could not update seats', type: 'error' });
    } finally {
      setIsUpdatingSeats(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.outlineVariant} />
        <Text style={{ ...typography.bodyLg, color: colors.onSurfaceVariant, marginTop: spacing.lg, textAlign: 'center' }}>
          {error || 'Trip not found'}
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}>
          <Text style={{ ...typography.labelLg, color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Normalize API field names (camelCase or snake_case)
  const heroImage = trip.heroImage || trip.hero_image;
  const gallery: string[] = trip.gallery || [];
  const highlights: string[] = trip.highlights || [];
  const itinerary: { day: string; title: string; desc: string }[] = trip.itinerary || [];
  const reviews: any[] = trip.reviews || [];
  const seatsLeft = trip.seatsLeft ?? trip.seats_left ?? 0;
  const totalSeats = trip.totalSeats ?? trip.total_seats ?? 0;
  const reviewCount = trip.reviewCount ?? trip.review_count ?? reviews.length;
  const host = trip.host || {};
  const isOwnTrip = user?.id === host.id;
  const tripStartDate = trip.startDate || trip.start_date;
  const startDatePassed = tripStartDate ? new Date(tripStartDate) < new Date(new Date().toDateString()) : false;
  const noSeats = seatsLeft <= 0;
  const myBookingStatus = trip.myBookingStatus ?? trip.my_booking_status ?? null;
  const isBookingConfirmed = myBookingStatus === 'confirmed';
  const alreadyRequested = hasRequested || myBookingStatus === 'pending' || myBookingStatus === 'confirmed';
  const canRequest = !isOwnTrip && !noSeats && !alreadyRequested && user?.role === 'traveler';

  return (
    <View style={styles.container}>
      {/* Animated Header Bar */}
      <Animated.View style={[styles.headerBar, { paddingTop: insets.top }, { opacity: headerBarOpacity }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <Text style={styles.headerBarTitle}>{trip.title}</Text>
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={[styles.navButtons, { top: insets.top + 8 }]}>
        <Pressable style={styles.navButton} onPress={() => navigation.goBack()}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.navRight}>
          <Pressable style={styles.navButton}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <Ionicons name="heart-outline" size={20} color={colors.onSurface} />
          </Pressable>
          <Pressable style={styles.navButton}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <Ionicons name="share-outline" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {heroImage ? (
            <Animated.Image
              source={{ uri: heroImage }}
              style={[
                styles.heroImage,
                {
                  transform: [
                    { translateY: heroTranslateY },
                    { scale: heroScale },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={48} color={colors.outlineVariant} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', colors.surfaceFade, colors.surface]}
            style={styles.heroGradient}
            locations={[0.3, 0.7, 1]}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <Animated.View style={fadeIn(sectionAnims[0])}>
            <View style={styles.metaRow}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                <Text style={styles.dateText}>{trip.dates}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
                <Text style={styles.dateText}>{trip.duration}</Text>
              </View>
              <View style={[styles.seatsBadge, noSeats && styles.seatsBadgeFull]}>
                <Text style={[styles.seatsText, noSeats && styles.seatsTextFull]}>
                  {noSeats ? 'Fully Booked' : `${seatsLeft} of ${totalSeats} seats left`}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{trip.title}</Text>
            {trip.subtitle ? <Text style={styles.subtitle}>{trip.subtitle}</Text> : null}

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.locationText}>{trip.location}</Text>
            </View>

            {/* Seats Stepper — planner only */}
            {isOwnTrip ? (
              <View style={styles.seatsStepper}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.seatsStepperLabel}>Seats Left</Text>
                  <Text style={styles.seatsStepperSub}>{totalSeats} total seats</Text>
                </View>
                <View style={styles.seatsStepperControls}>
                  <Pressable
                    onPress={() => handleUpdateSeats(-1)}
                    disabled={isUpdatingSeats || seatsLeft <= 0}
                    style={[styles.seatsStepperBtn, (isUpdatingSeats || seatsLeft <= 0) && { opacity: 0.3 }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.onSurface} />
                  </Pressable>
                  <Text style={styles.seatsStepperCount}>
                    {isUpdatingSeats ? '...' : seatsLeft}
                  </Text>
                  <Pressable
                    onPress={() => handleUpdateSeats(1)}
                    disabled={isUpdatingSeats || seatsLeft >= totalSeats}
                    style={[styles.seatsStepperBtn, (isUpdatingSeats || seatsLeft >= totalSeats) && { opacity: 0.3 }]}
                  >
                    <Ionicons name="add" size={18} color={colors.onSurface} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Urgency Banner — traveler view, ≤20% seats remaining */}
            {!isOwnTrip && !noSeats && totalSeats > 0 && seatsLeft <= Math.ceil(totalSeats * 0.2) ? (
              <View style={styles.urgencyBanner}>
                <Ionicons name="flame" size={16} color={colors.error} />
                <Text style={styles.urgencyText}>
                  Only {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left — Request to join now!
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Host Card — clickable to open agency profile */}
          {host.name ? (
            <Pressable onPress={() => !isOwnTrip && host.id && navigation.navigate('AgencyDetail', { agencyId: host.id })}>
              <Animated.View style={[styles.hostCard, shadows.soft, fadeIn(sectionAnims[1])]}>
                <View style={styles.hostTop}>
                  {host.avatar ? (
                    <Image source={{ uri: host.avatar }} style={styles.hostAvatar} />
                  ) : (
                    <View style={[styles.hostAvatar, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={20} color={colors.outlineVariant} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hostName}>{host.name}</Text>
                    {host.guild ? <Text style={styles.hostGuild}>{host.guild}</Text> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={styles.hostRating}>
                      <Ionicons name="star" size={14} color={colors.star} />
                      <Text style={styles.hostRatingText}>{host.rating ?? 0}</Text>
                    </View>
                    {!isOwnTrip && <Ionicons name="chevron-forward" size={16} color={colors.outlineVariant} />}
                  </View>
                </View>
                {host.bio ? <Text style={styles.hostBio}>{host.bio}</Text> : null}
                <View style={styles.hostStats}>
                  <View style={styles.hostStat}>
                    <Text style={styles.hostStatNumber}>{host.tripsHosted ?? host.trips_hosted ?? 0}</Text>
                    <Text style={styles.hostStatLabel}>Trips Hosted</Text>
                  </View>
                  <View style={styles.hostStatDivider} />
                  <View style={styles.hostStat}>
                    <Text style={styles.hostStatNumber}>{host.rating ?? 0}</Text>
                    <Text style={styles.hostStatLabel}>Rating</Text>
                  </View>
                  <View style={styles.hostStatDivider} />
                  <View style={styles.hostStat}>
                    <Text style={styles.hostStatNumber}>{reviewCount}</Text>
                    <Text style={styles.hostStatLabel}>Reviews</Text>
                  </View>
                </View>
                {host.phone && !isOwnTrip && isBookingConfirmed ? (
                  <Pressable onPress={handleCallPlanner} style={styles.callButton}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={styles.callButtonText}>Call to Confirm Booking</Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            </Pressable>
          ) : null}

          {/* Verification Disclaimer (traveler view only) */}
          {!isOwnTrip && user?.role === 'traveler' ? (() => {
            const nUrl = host?.nazaryUrl ?? host?.nazary_url;
            const instaUrl = host?.instagramUrl ?? host?.instagram_url;
            const tiktokUrl = host?.tiktokUrl ?? host?.tiktok_url;
            if (!nUrl) return null;
            return (
              <Animated.View style={[styles.disclaimerCard, fadeIn(sectionAnims[1])]}>
                <View style={styles.disclaimerIconRow}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={colors.warning} />
                  <Text style={styles.disclaimerTitle}>Verify this agency before joining</Text>
                </View>
                <Text style={styles.disclaimerText}>
                  Check that this agency has their Nazary link in their{' '}
                  {instaUrl ? 'Instagram' : ''}{instaUrl && tiktokUrl ? ' or ' : ''}{tiktokUrl ? 'TikTok' : ''}{' '}
                  bio to confirm they are legitimate.
                </Text>
                <View style={styles.disclaimerLinkBox}>
                  <Ionicons name="link-outline" size={14} color={colors.primary} />
                  <Text style={styles.disclaimerLinkText} selectable>{nUrl}</Text>
                </View>
                <View style={styles.disclaimerSocialRow}>
                  {instaUrl ? (
                    <Pressable style={styles.disclaimerSocialBtn} onPress={() => Linking.openURL(instaUrl)}>
                      <Ionicons name="logo-instagram" size={16} color="#E4405F" />
                      <Text style={styles.disclaimerSocialText}>Open Instagram</Text>
                    </Pressable>
                  ) : null}
                  {tiktokUrl ? (
                    <Pressable style={styles.disclaimerSocialBtn} onPress={() => Linking.openURL(tiktokUrl)}>
                      <Ionicons name="logo-tiktok" size={16} color={colors.onSurface} />
                      <Text style={styles.disclaimerSocialText}>Open TikTok</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.disclaimerSocialBtn} onPress={() => navigation.navigate('AgencyDetail', { agencyId: host.id })}>
                    <Ionicons name="business-outline" size={16} color={colors.primary} />
                    <Text style={[styles.disclaimerSocialText, { color: colors.primary }]}>View Profile</Text>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })() : null}

          {/* Join Requests (planner only) */}
          {isOwnTrip && (
            <Animated.View style={[styles.section, fadeIn(sectionAnims[2])]}>
              <View style={styles.joinRequestsHeader}>
                <Text style={styles.sectionTitle}>Join Requests</Text>
                {tripBookings.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{tripBookings.length}</Text>
                  </View>
                )}
              </View>
              {tripBookings.length === 0 ? (
                <View style={styles.emptyBookings}>
                  <Ionicons name="people-outline" size={32} color={colors.outlineVariant} />
                  <Text style={styles.emptyBookingsText}>No requests yet</Text>
                </View>
              ) : (
                tripBookings.map((booking) => {
                  const avatar = booking.travelerAvatar ?? booking.traveler_avatar;
                  const name = booking.travelerName ?? booking.traveler_name ?? 'Traveler';
                  const phone = booking.travelerPhone ?? booking.traveler_phone;
                  return (
                  <View key={booking.id} style={[styles.bookingRequestCard, shadows.soft]}>
                    <View style={styles.bookingRequestTop}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.bookingRequestAvatar} />
                      ) : (
                        <View style={[styles.bookingRequestAvatar, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="person" size={16} color={colors.outlineVariant} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingRequestName}>{name}</Text>
                        {phone ? (
                          <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.bookingRequestPhoneRow}>
                            <Ionicons name="call-outline" size={12} color={colors.primary} />
                            <Text style={styles.bookingRequestPhone}>{phone}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <StatusBadge status={booking.status} />
                    </View>
                    {booking.status === 'pending' && (
                      <View style={styles.bookingRequestActions}>
                        <Pressable onPress={() => handleConfirmBooking(booking)} style={[styles.bookingRequestActionBtn, styles.bookingRequestAcceptBtn]}>
                          <Ionicons name="checkmark" size={16} color={colors.success} />
                          <Text style={[styles.bookingRequestActionText, { color: colors.success }]}>Accept</Text>
                        </Pressable>
                        <Pressable onPress={() => handleRejectBooking(booking)} style={[styles.bookingRequestActionBtn, styles.bookingRequestRejectBtn]}>
                          <Ionicons name="close" size={16} color={colors.error} />
                          <Text style={[styles.bookingRequestActionText, { color: colors.error }]}>Reject</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* Description */}
          {trip.description ? (
            <Animated.View style={[styles.section, fadeIn(sectionAnims[3])]}>
              <Text style={styles.sectionTitle}>About This Trip</Text>
              <Text style={styles.description}>{trip.description}</Text>
            </Animated.View>
          ) : null}

          {/* Highlights */}
          {highlights.length > 0 ? (
            <Animated.View style={[styles.section, fadeIn(sectionAnims[4])]}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {highlights.map((highlight: string, index: number) => (
                <View key={index} style={styles.highlightRow}>
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* Gallery */}
          {gallery.length > 0 ? (
            <Animated.View style={[styles.section, fadeIn(sectionAnims[5])]}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {gallery.map((img: string, index: number) => (
                  <Image key={index} source={{ uri: img }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            </Animated.View>
          ) : null}

          {/* Itinerary */}
          {itinerary.length > 0 ? (
            <Animated.View style={[styles.section, fadeIn(sectionAnims[6])]}>
              <Text style={styles.sectionTitle}>Itinerary</Text>
              {itinerary.map((item: any, index: number) => (
                <View key={index} style={styles.itineraryItem}>
                  <View style={styles.itineraryDayBadge}>
                    <Text style={styles.itineraryDay}>{item.day}</Text>
                  </View>
                  <View style={styles.itineraryContent}>
                    <Text style={styles.itineraryTitle}>{item.title}</Text>
                    <Text style={styles.itineraryDesc}>{item.desc}</Text>
                  </View>
                  {index < itinerary.length - 1 && <View style={styles.itineraryLine} />}
                </View>
              ))}
            </Animated.View>
          ) : null}

          {/* Reviews */}
          <Animated.View style={[styles.section, fadeIn(sectionAnims[7])]}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.length > 0 ? (
              reviews.map((review: any) => (
                <View key={review.id} style={[styles.reviewCard, shadows.soft]}>
                  <View style={styles.reviewHeader}>
                    {review.avatar ? (
                      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={[styles.reviewAvatar, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="person" size={14} color={colors.outlineVariant} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{review.name}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Ionicons key={i} name="star" size={12} color={colors.star} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.text}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubble-outline" size={36} color={colors.outlineVariant} />
                <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
                <Text style={styles.emptyReviewsText}>
                  Be the first to share your experience on this trip.
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.bottomContent}>
          <View>
            <Text style={styles.bottomPrice}>PKR {(trip.price ?? 0).toLocaleString()}</Text>
            <Text style={styles.bottomPricePer}>per person</Text>
          </View>
          {isOwnTrip && !startDatePassed ? (
            <Pressable onPress={() => navigation.navigate('CreateTrip', { tripId })}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookButton}
              >
                <Ionicons name="create-outline" size={16} color={colors.onPrimary} />
                <Text style={styles.bookText}>Manage Trip</Text>
              </LinearGradient>
            </Pressable>
          ) : isBookingConfirmed ? (
            <Pressable onPress={handleCallPlanner} style={styles.confirmedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.confirmedText}>Confirmed</Text>
            </Pressable>
          ) : alreadyRequested ? (
            <View style={styles.requestedBadge}>
              <Ionicons name="time-outline" size={18} color={colors.warning} />
              <Text style={styles.requestedText}>Pending</Text>
            </View>
          ) : noSeats ? (
            <View style={styles.fullBadge}>
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <Text style={styles.fullText}>Fully Booked</Text>
            </View>
          ) : (
            <Pressable onPress={handleRequestToJoin} disabled={!canRequest || isRequesting}>
              <LinearGradient
                colors={canRequest ? [colors.primary, colors.primaryContainer] : [colors.outlineVariant, colors.outlineVariant]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.bookButton, isRequesting && { opacity: 0.6 }]}
              >
                {isRequesting ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.bookText}>Request to Join</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    overflow: 'hidden',
  },
  headerBarTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurface,
  },
  navButtons: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width,
    height: HERO_HEIGHT + 100,
    position: 'absolute',
    top: -50,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.5,
  },
  content: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing['2xl'],
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  seatsBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  seatsBadgeFull: {
    backgroundColor: colors.errorTint,
  },
  seatsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.success,
    letterSpacing: 0.3,
  },
  seatsTextFull: {
    color: colors.error,
  },
  // Seats Stepper (planner)
  seatsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  seatsStepperLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  seatsStepperSub: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  seatsStepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  seatsStepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatsStepperCount: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    color: colors.onSurface,
    minWidth: 28,
    textAlign: 'center',
  },
  // Urgency Banner
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorTint,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  urgencyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  title: {
    fontFamily: 'Manrope_300Light',
    fontSize: 34,
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing['2xl'],
  },
  locationText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  // Host Card
  hostCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  hostTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostName: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurface,
  },
  hostGuild: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  hostRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostRatingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  hostBio: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  hostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
  },
  hostStat: {
    alignItems: 'center',
  },
  hostStatNumber: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: 2,
  },
  hostStatLabel: {
    fontFamily: 'Inter_300Light',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  hostStatDivider: {
    width: 0.5,
    height: 28,
    backgroundColor: colors.outlineVariant,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primaryTint,
  },
  callButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.primary,
  },
  // Disclaimer
  disclaimerCard: {
    backgroundColor: colors.warningLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  disclaimerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  disclaimerTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '600',
  },
  disclaimerText: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  disclaimerLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.primary,
    flex: 1,
  },
  disclaimerSocialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  disclaimerSocialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  disclaimerSocialText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurface,
  },
  // Sections
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    lineHeight: 26,
  },
  // Highlights
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  // Gallery
  galleryScroll: {
    gap: spacing.md,
  },
  galleryImage: {
    width: 160,
    height: 120,
    borderRadius: radii.md,
  },
  // Itinerary
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    position: 'relative',
  },
  itineraryDayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itineraryDay: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: colors.primary,
  },
  itineraryContent: {
    flex: 1,
    paddingTop: 2,
  },
  itineraryTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 4,
  },
  itineraryDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  itineraryLine: {
    position: 'absolute',
    left: 17.5,
    top: 40,
    bottom: -spacing.xl + 4,
    width: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.4,
  },
  // Reviews
  reviewCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.onSurface,
  },
  reviewDate: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
  },
  emptyReviewsTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurface,
    marginTop: spacing.md,
  },
  emptyReviewsText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Join Requests
  joinRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onPrimary,
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    gap: spacing.sm,
  },
  emptyBookingsText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bookingRequestCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bookingRequestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bookingRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  bookingRequestName: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: colors.onSurface,
  },
  bookingRequestPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bookingRequestPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.primary,
  },
  bookingRequestActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  bookingRequestActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 38,
    borderRadius: radii.md,
  },
  bookingRequestAcceptBtn: {
    backgroundColor: colors.successLight,
  },
  bookingRequestRejectBtn: {
    backgroundColor: colors.errorContainer,
  },
  bookingRequestActionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  bottomPrice: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 24,
    color: colors.onSurface,
  },
  bottomPricePer: {
    fontFamily: 'Inter_300Light',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.xl,
  },
  bookText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.successLight,
  },
  confirmedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.success,
  },
  requestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.warningLight,
  },
  requestedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.warning,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.errorTint,
  },
  fullText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.error,
  },
});
