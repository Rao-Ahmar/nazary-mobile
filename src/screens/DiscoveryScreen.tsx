import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  TextInput,
  FlatList,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../theme';
import { featuredTrips, categories, curatedCollections } from '../data/mockData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const COLLECTION_WIDTH = width * 0.42;

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

/**
 * Creates a staggered fade-in for a fixed number of items.
 * Each item fades from 0 -> 1 with a delay of baseDelay + index * stagger.
 */
function useStaggeredFadeIn(count: number, baseDelay = 200, stagger = 80) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    const timers = anims.map((anim, i) =>
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, baseDelay + i * stagger)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return anims;
}

/**
 * Creates a single fade-in animation value triggered after `delay` ms.
 */
function useFadeIn(delay: number, duration: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return anim;
}

/** Style object for a fade-in-down animation (opacity + translateY). */
function fadeInDownStyle(anim: Animated.Value) {
  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };
}

/** Style object for a fade-in-right animation (opacity + translateX). */
function fadeInRightStyle(anim: Animated.Value) {
  return {
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscoveryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = React.useState('1');

  // Single-element fade-in-down animations
  const headerAnim = useFadeIn(100, 600);
  const searchAnim = useFadeIn(200, 600);

  // Staggered animations
  const categoryAnims = useStaggeredFadeIn(categories.length, 100, 60);
  const featuredAnims = useStaggeredFadeIn(featuredTrips.length, 300, 150);
  const collectionAnims = useStaggeredFadeIn(curatedCollections.length, 200, 100);

  const renderCategoryChip = (category: typeof categories[0], index: number) => {
    const isSelected = selectedCategory === category.id;
    return (
      <Animated.View
        key={category.id}
        style={fadeInRightStyle(categoryAnims[index])}
      >
        <Pressable
          onPress={() => setSelectedCategory(category.id)}
          style={[
            styles.chip,
            isSelected && styles.chipSelected,
          ]}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {category.label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderFeaturedCard = (trip: typeof featuredTrips[0], index: number) => (
    <Animated.View
      key={trip.id}
      style={[styles.featuredCard, shadows.card, fadeInDownStyle(featuredAnims[index])]}
    >
      <Pressable onPress={() => navigation.navigate('TripDetails')}>
        <ImageBackground
          source={{ uri: trip.image }}
          style={styles.featuredImage}
          imageStyle={{ borderRadius: radii.xl }}
          resizeMode="cover"
        >
          {/* Top badges */}
          <View style={styles.featuredBadges}>
            <View style={styles.seatsBadge}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.seatsBadgeText}>{trip.seatsLeft} seats left</Text>
            </View>
          </View>

          {/* Bottom glassmorphic overlay */}
          <View style={styles.featuredOverlay}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.featuredContent}>
              <View style={styles.featuredTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredTitle}>{trip.title}</Text>
                  <Text style={styles.featuredLocation}>
                    <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />{' '}
                    {trip.location}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
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
                  <Text style={styles.priceAmount}>${trip.price.toLocaleString()}</Text>
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
    <Animated.View
      key={collection.id}
      style={fadeInRightStyle(collectionAnims[index])}
    >
      <Pressable style={styles.collectionCard}>
        <ImageBackground
          source={{ uri: collection.image }}
          style={styles.collectionImage}
          imageStyle={{ borderRadius: radii.lg }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.collectionGradient}
          >
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <Text style={styles.collectionSubtitle}>{collection.subtitle}</Text>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, fadeInDownStyle(headerAnim)]}
        >
          <View>
            <Text style={styles.greeting}>Where to next?</Text>
            <Text style={styles.subGreeting}>Discover curated experiences</Text>
          </View>
          <Pressable style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }}
              style={styles.avatar}
            />
            <View style={styles.notificationDot} />
          </Pressable>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          style={[styles.searchContainer, fadeInDownStyle(searchAnim)]}
        >
          <Ionicons name="search-outline" size={18} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations, experiences..."
            placeholderTextColor={colors.outline}
          />
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={18} color={colors.onSurface} />
          </Pressable>
        </Animated.View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
          style={styles.chipScroll}
        >
          {categories.map((cat, i) => renderCategoryChip(cat, i))}
        </ScrollView>

        {/* Featured Trips */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Curated for You</Text>
            <Pressable>
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </View>
          {featuredTrips.map((trip, i) => renderFeaturedCard(trip, i))}
        </View>

        {/* Collections */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <Pressable>
              <Text style={styles.seeAll}>SEE ALL</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsScroll}
          >
            {curatedCollections.map((c, i) => renderCollectionCard(c, i))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  greeting: {
    fontFamily: 'Manrope_300Light',
    fontSize: 32,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  subGreeting: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 50,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    marginBottom: spacing['2xl'],
  },
  chipContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  sectionContainer: {
    marginBottom: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 22,
    color: colors.onSurface,
  },
  seeAll: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1,
  },
  // Featured Cards
  featuredCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
  },
  featuredImage: {
    height: 380,
    justifyContent: 'space-between',
  },
  featuredBadges: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  seatsBadge: {
    borderRadius: radii.full,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  seatsBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.onSurface,
    letterSpacing: 0.3,
  },
  featuredOverlay: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  featuredContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  featuredTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: 4,
  },
  featuredLocation: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  ratingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#92700c',
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  hostName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurface,
  },
  hostGuild: {
    fontFamily: 'Inter_300Light',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 20,
    color: colors.onSurface,
  },
  pricePer: {
    fontFamily: 'Inter_300Light',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(238,238,240,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  tagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  duration: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginLeft: 'auto',
  },
  // Collections
  collectionsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  collectionCard: {
    width: COLLECTION_WIDTH,
    height: COLLECTION_WIDTH * 1.3,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  collectionImage: {
    flex: 1,
  },
  collectionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing['3xl'],
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  collectionTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  collectionSubtitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
});
