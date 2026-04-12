import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { featuredTrips as mockFeaturedTrips, categories, curatedCollections } from '../../data/mockData';
import { useAuthStore } from '../../store';
import { NotificationBell } from '../../components/NotificationBell';
import { tripsApi } from '../../api/trips';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const COLLECTION_WIDTH = width * 0.42;

type FeaturedTrip = {
  id: string;
  title: string;
  location: string;
  image: any;
  price: number;
  currency: string;
  duration: string;
  dates: string;
  seatsLeft: number;
  host: { name: string; avatar: string; guild: string };
  tags: string[];
  rating: number;
  reviewCount: number;
};

function useStaggeredFadeIn(count: number, baseDelay = 200, stagger = 80) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    const timers = anims.map((anim, i) =>
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, baseDelay + i * stagger),
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return anims;
}

function useFadeIn(delay: number, duration: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return anim;
}

function fadeInDownStyle(anim: Animated.Value) {
  return {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };
}

function fadeInRightStyle(anim: Animated.Value) {
  return {
    opacity: anim,
    transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };
}

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = React.useState('1');
  const user = useAuthStore((s) => s.user);
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [featuredTripsData, setFeaturedTripsData] = useState<FeaturedTrip[]>(mockFeaturedTrips);

  useEffect(() => {
    (async () => {
      try {
        const response = await tripsApi.getFeatured();
        const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
        if (data.length > 0) {
          const mapped: FeaturedTrip[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            location: t.location,
            image: t.hero_image || t.heroImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
            price: t.price,
            currency: t.currency || 'PKR',
            duration: t.duration,
            dates: t.dates || '',
            seatsLeft: t.seats_left ?? t.seatsLeft ?? 0,
            host: t.host ? {
              name: t.host.name || 'Unknown',
              avatar: t.host.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
              guild: t.host.guild || t.host.agency_name || '',
            } : { name: 'Unknown', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', guild: '' },
            tags: t.tags || [],
            rating: t.rating ?? t.average_rating ?? 0,
            reviewCount: t.review_count ?? t.reviewCount ?? 0,
          }));
          setFeaturedTripsData(mapped);
        }
      } catch {
        // Keep mock data as fallback
      }
    })();
  }, []);

  const headerAnim = useFadeIn(100, 600);
  const searchAnim = useFadeIn(200, 600);
  const categoryAnims = useStaggeredFadeIn(categories.length, 100, 60);
  const featuredAnims = useStaggeredFadeIn(featuredTripsData.length, 300, 150);
  const collectionAnims = useStaggeredFadeIn(curatedCollections.length, 200, 100);
  const actionCardsAnim = useFadeIn(250, 600);

  const renderCategoryChip = (category: typeof categories[0], index: number) => {
    const isSelected = selectedCategory === category.id;
    return (
      <Animated.View key={category.id} style={fadeInRightStyle(categoryAnims[index])}>
        <Pressable onPress={() => setSelectedCategory(category.id)} style={[styles.chip, isSelected && styles.chipSelected]}>
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{category.label}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderFeaturedCard = (trip: FeaturedTrip, index: number) => (
    <Animated.View key={trip.id} style={[styles.featuredCard, shadows.card, fadeInDownStyle(featuredAnims[index] || new Animated.Value(1))]}>
      <Pressable onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}>
        <ImageBackground source={typeof trip.image === 'string' ? { uri: trip.image } : trip.image} style={styles.featuredImage} imageStyle={{ borderRadius: radii.xl }} resizeMode="cover">
          <View style={styles.featuredBadges}>
            <View style={styles.seatsBadge}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.seatsBadgeText}>{trip.seatsLeft} seats left</Text>
            </View>
          </View>
          <View style={styles.featuredOverlay}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredTitle}>{trip.title}</Text>
                  <Text style={styles.featuredLocation}>
                    <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} /> {trip.location}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Text style={styles.ratingText}>{trip.rating}</Text>
                </View>
              </View>
              <View style={styles.featuredBottom}>
                <View style={styles.hostInfo}>
                  <Image source={{ uri: trip.host.avatar }} style={styles.hostAvatar} />
                  <View>
                    <Text style={styles.hostName}>{trip.host.name}</Text>
                    <Text style={styles.hostGuild}>{trip.host.guild}</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>{trip.currency === 'PKR' ? 'PKR ' : '$'}{trip.price.toLocaleString()}</Text>
                  <Text style={styles.pricePer}>per person</Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                {trip.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                <Text style={styles.duration}>{trip.duration}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );

  const renderCollectionCard = (collection: typeof curatedCollections[0], index: number) => (
    <Animated.View key={collection.id} style={fadeInRightStyle(collectionAnims[index])}>
      <Pressable style={styles.collectionCard}>
        <ImageBackground source={typeof collection.image === 'string' ? { uri: collection.image } : collection.image} style={styles.collectionImage} imageStyle={{ borderRadius: radii.lg }} resizeMode="cover">
          <LinearGradient colors={['transparent', colors.imageOverlay]} style={styles.collectionGradient}>
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <Text style={styles.collectionSubtitle}>{collection.subtitle}</Text>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.header, fadeInDownStyle(headerAnim)]}>
          <View>
            <Text style={styles.greeting}>Where to next?</Text>
            <Text style={styles.subGreeting}>Discover curated experiences</Text>
          </View>
          <NotificationBell />
        </Animated.View>

        <Animated.View style={[styles.searchContainer, fadeInDownStyle(searchAnim)]}>
          <Pressable style={styles.searchPressable} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search-outline" size={18} color={colors.outline} />
            <Text style={styles.searchPlaceholder}>Search destinations, experiences...</Text>
          </Pressable>
          <Pressable style={styles.filterButton} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="options-outline" size={18} color={colors.onSurface} />
          </Pressable>
        </Animated.View>

        {/* Action Cards: Custom Trip + Places + Bike Trips */}
        <Animated.View style={[styles.actionCardsRow, fadeInDownStyle(actionCardsAnim)]}>
          <Pressable onPress={() => navigation.navigate('CreateTripRequest', {})} style={[styles.actionCard, shadows.soft]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionCardTitle}>Custom Trip</Text>
            <Text style={styles.actionCardSub}>Request a planner</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Places')} style={[styles.actionCard, shadows.soft]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="compass-outline" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionCardTitle}>Explore Places</Text>
            <Text style={styles.actionCardSub}>Discover Pakistan</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('BikeTrips')} style={[styles.actionCard, shadows.soft]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="bicycle-outline" size={20} color={colors.warning} />
            </View>
            <Text style={styles.actionCardTitle}>Bike Trips</Text>
            <Text style={styles.actionCardSub}>Premium rides</Text>
          </Pressable>
        </Animated.View>

        {/* Arrange a Trip for Me -- Premium Feature */}
        <Animated.View style={[{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }, fadeInDownStyle(actionCardsAnim)]}>
          <Pressable onPress={() => navigation.navigate('ArrangeATrip')} style={[styles.arrangeCard, shadows.card]}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.arrangeGradient}>
              <View style={styles.arrangeContent}>
                <View style={{ flex: 1 }}>
                  <View style={styles.arrangeBadge}>
                    <Ionicons name="star" size={12} color={colors.star} />
                    <Text style={styles.arrangeBadgeText}>Premium</Text>
                  </View>
                  <Text style={styles.arrangeTitle}>Arrange a Trip for Me</Text>
                  <Text style={styles.arrangeSub}>Let our team curate the perfect trip based on your preferences</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={36} color={colors.onImageMuted} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer} style={styles.chipScroll}>
          {categories.map((cat, i) => renderCategoryChip(cat, i))}
        </ScrollView>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Curated for You</Text>
            <Pressable onPress={() => navigation.navigate('Search')}><Text style={styles.seeAll}>SEE ALL</Text></Pressable>
          </View>
          {featuredTripsData.map((trip, i) => renderFeaturedCard(trip, i))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <Pressable><Text style={styles.seeAll}>SEE ALL</Text></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsScroll}>
            {curatedCollections.map((c, i) => renderCollectionCard(c, i))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingTop: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  greeting: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  subGreeting: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, height: 50, marginBottom: spacing.xl, gap: spacing.sm },
  searchPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.lg, height: 50, gap: spacing.md },
  searchPlaceholder: { ...typography.bodyMd, color: colors.outline },
  filterButton: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  actionCardsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
  actionCard: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.md, alignItems: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actionCardTitle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.onSurface, textAlign: 'center' },
  actionCardSub: { fontFamily: 'Inter_300Light', fontSize: 9, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 },
  chipScroll: { marginBottom: spacing['2xl'] },
  chipContainer: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  chipTextSelected: { color: colors.onPrimary },
  sectionContainer: { marginBottom: spacing['3xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface },
  seeAll: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.primary, letterSpacing: 1 },
  featuredCard: { marginHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: radii.xl },
  featuredImage: { height: 380, justifyContent: 'space-between' },
  featuredBadges: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.lg },
  seatsBadge: { borderRadius: radii.full, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 6 },
  seatsBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.onSurface, letterSpacing: 0.3 },
  featuredOverlay: { borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl, overflow: 'hidden' },
  featuredContent: { padding: spacing.lg, paddingTop: spacing.xl },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  featuredTitle: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface, marginBottom: 4 },
  featuredLocation: { ...typography.bodySm, color: colors.onSurfaceVariant },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.starTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  ratingText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.ratingText },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostAvatar: { width: 32, height: 32, borderRadius: 16 },
  hostName: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurface },
  hostGuild: { fontFamily: 'Inter_300Light', fontSize: 10, color: colors.onSurfaceVariant },
  priceContainer: { alignItems: 'flex-end' },
  priceAmount: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface },
  pricePer: { fontFamily: 'Inter_300Light', fontSize: 10, color: colors.onSurfaceVariant },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { backgroundColor: colors.tagBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  tagText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  duration: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginLeft: 'auto' },
  collectionsScroll: { paddingHorizontal: spacing.xl, gap: spacing.md },
  collectionCard: { width: COLLECTION_WIDTH, height: COLLECTION_WIDTH * 1.3, borderRadius: radii.lg, overflow: 'hidden' },
  collectionImage: { flex: 1 },
  collectionGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingTop: spacing['3xl'], borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg },
  collectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onImage, marginBottom: 2 },
  collectionSubtitle: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onImageMuted },
  arrangeCard: { borderRadius: radii.xl, overflow: 'hidden' },
  arrangeGradient: { borderRadius: radii.xl, padding: spacing.xl },
  arrangeContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  arrangeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.imageBadgeBgDark, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full, marginBottom: spacing.sm },
  arrangeBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.star, letterSpacing: 0.3 },
  arrangeTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onImage, marginBottom: 4 },
  arrangeSub: { fontFamily: 'Inter_300Light', fontSize: 12, color: colors.onImageMuted, lineHeight: 18 },
});
