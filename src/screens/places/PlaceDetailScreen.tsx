import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';

const { width } = Dimensions.get('window');

const mockPlaceDetail = {
  id: '1',
  name: 'Hunza Valley',
  region: 'Gilgit-Baltistan',
  description: 'A stunning mountainous valley in the Karakoram range, known for its breathtaking views, ancient forts, and the hospitality of the Hunza people.',
  coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  rating: 5.0,
  reviewCount: 2,
};

const mockReviews = [
  { id: '1', name: 'Sarah Kennedy', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', rating: 5, text: 'The most beautiful place I\'ve ever visited. The views of Rakaposhi are simply breathtaking!', date: 'Mar 2026' },
  { id: '2', name: 'Ahmed Raza', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', rating: 5, text: 'Incredible hospitality and stunning landscapes. A must-visit for every traveler.', date: 'Feb 2026' },
];

export function PlaceDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const place = mockPlaceDetail;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: place.coverImage }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', colors.imageOverlayStrong]} style={styles.heroGradient}>
            <Text style={styles.heroName}>{place.name}</Text>
            <Text style={styles.heroRegion}>{place.region}</Text>
          </LinearGradient>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { top: insets.top + spacing.sm }]}>
            <Ionicons name="arrow-back" size={22} color={colors.onImage} />
          </Pressable>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.ratingRow}>
            <StarRating rating={Math.round(place.rating)} size={18} />
            <Text style={styles.ratingText}>{place.rating} ({place.reviewCount} reviews)</Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{place.description}</Text>

          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Pressable onPress={() => navigation.navigate('WriteReview', { type: 'place', targetId: place.id, targetName: place.name })}>
              <Text style={styles.writeReview}>Write a Review</Text>
            </Pressable>
          </View>
          {mockReviews.map((r) => (
            <ReviewCard key={r.id} name={r.name} avatar={r.avatar} rating={r.rating} text={r.text} date={r.date} />
          ))}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  heroContainer: { position: 'relative' },
  heroImage: { width, height: width * 0.7 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, paddingTop: spacing['3xl'] },
  heroName: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onImage, letterSpacing: -0.5 },
  heroRegion: { fontFamily: 'Inter_300Light', fontSize: 14, color: colors.onImageMuted, marginTop: 4 },
  backButton: { position: 'absolute', left: spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.scrimLight, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  ratingText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: spacing.md },
  description: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing['2xl'] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  writeReview: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
});
