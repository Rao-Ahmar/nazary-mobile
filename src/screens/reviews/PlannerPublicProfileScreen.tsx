import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';

const mockPlanner = {
  id: '1',
  name: 'Alex Romanov',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  agencyName: 'Romanov Expeditions',
  agencyTagline: 'Where adventure meets culture',
  yearsExperience: 12,
  bio: 'Mountain guide & cultural anthropologist with 12 years of expedition experience across Central Asia.',
  guild: 'Nazary Private Guild',
  rating: 4.9,
  plannerRating: 4.7,
  tripsHosted: 34,
  totalReviews: 47,
};

const mockReviews = [
  { id: '1', name: 'Sarah Kennedy', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', rating: 5, text: 'Alex is an incredible guide. Extremely knowledgeable about the mountains and local culture!', date: 'Mar 2026' },
  { id: '2', name: 'Ahmed Raza', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', rating: 4, text: 'Great experience overall. Well organized trips with good attention to safety.', date: 'Feb 2026' },
];

export function PlannerPublicProfileScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const planner = mockPlanner;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Planner Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={styles.profileSection}>
            <Image source={{ uri: planner.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{planner.name}</Text>
            {planner.agencyName && <Text style={styles.agencyName}>{planner.agencyName}</Text>}
            {planner.agencyTagline && <Text style={styles.tagline}>{planner.agencyTagline}</Text>}
            <StarRating rating={Math.round(planner.plannerRating)} size={20} style={{ marginTop: spacing.md }} />
            <Text style={styles.ratingText}>{planner.plannerRating} ({planner.totalReviews} reviews)</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{planner.tripsHosted}</Text>
              <Text style={styles.statLabel}>Trips Hosted</Text>
            </View>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{planner.yearsExperience}y</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={[styles.statCard, shadows.soft]}>
              <Text style={styles.statValue}>{planner.plannerRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {planner.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{planner.bio}</Text>
            </View>
          )}

          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable onPress={() => navigation.navigate('WriteReview', { type: 'planner', targetId: planner.id, targetName: planner.name })}>
                <Text style={styles.writeReview}>Write a Review</Text>
              </Pressable>
            </View>
            {mockReviews.map((r) => (
              <ReviewCard key={r.id} name={r.name} avatar={r.avatar} rating={r.rating} text={r.text} date={r.date} />
            ))}
          </View>
        </Animated.View>
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
  scrollContent: { paddingHorizontal: spacing.xl },
  profileSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md },
  name: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface },
  agencyName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary, marginTop: 4 },
  tagline: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 4 },
  ratingText: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] },
  statCard: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, alignItems: 'center' },
  statValue: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface },
  statLabel: { fontFamily: 'Inter_300Light', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 },
  bioSection: { marginBottom: spacing['2xl'] },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: spacing.md },
  bioText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  reviewsSection: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  writeReview: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
});
