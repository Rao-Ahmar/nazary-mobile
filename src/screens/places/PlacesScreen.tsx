import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, TextInput, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import { CategoryChip } from '../../components/CategoryChip';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const mockPlaces = [
  { id: '1', name: 'Hunza Valley', region: 'Gilgit-Baltistan', coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', rating: 5.0, reviewCount: 2 },
  { id: '2', name: 'Fairy Meadows', region: 'Gilgit-Baltistan', coverImage: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=80', rating: 4.0, reviewCount: 1 },
  { id: '3', name: 'Skardu', region: 'Gilgit-Baltistan', coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80', rating: 0, reviewCount: 0 },
  { id: '4', name: 'Swat Valley', region: 'Khyber Pakhtunkhwa', coverImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&q=80', rating: 0, reviewCount: 0 },
  { id: '5', name: 'Neelum Valley', region: 'Azad Kashmir', coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80', rating: 0, reviewCount: 0 },
  { id: '6', name: 'Lahore Old City', region: 'Punjab', coverImage: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&q=80', rating: 0, reviewCount: 0 },
  { id: '7', name: 'Mohenjo-daro', region: 'Sindh', coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80', rating: 0, reviewCount: 0 },
  { id: '8', name: 'Attabad Lake', region: 'Gilgit-Baltistan', coverImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80', rating: 0, reviewCount: 0 },
];

const regions = ['All', 'Gilgit-Baltistan', 'Khyber Pakhtunkhwa', 'Azad Kashmir', 'Punjab', 'Sindh'];

export function PlacesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = mockPlaces.filter((p) => {
    const matchRegion = selectedRegion === 'All' || p.region === selectedRegion;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  const anims = useRef(mockPlaces.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 80);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore Places</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.outline} />
        <TextInput style={styles.searchInput} placeholder="Search places..." placeholderTextColor={colors.outline} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={{ flexGrow: 0, flexShrink: 0, marginBottom: spacing.lg }}>
        {regions.map((r) => (
          <CategoryChip key={r} label={r} selected={selectedRegion === r} onPress={() => setSelectedRegion(r)} />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {filtered.map((place, i) => (
          <Animated.View key={place.id} style={[styles.placeCard, { opacity: anims[i] || 1, transform: [{ translateY: (anims[i] || new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Pressable onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })} style={[shadows.soft]}>
              <Image source={{ uri: place.coverImage }} style={styles.placeImage} />
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeRegion}>{place.region}</Text>
                {place.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.star} />
                    <Text style={styles.ratingText}>{place.rating} ({place.reviewCount})</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, marginHorizontal: spacing.xl, paddingHorizontal: spacing.lg, height: 50, marginBottom: spacing.lg },
  searchInput: { flex: 1, marginLeft: spacing.md, ...typography.bodyMd, color: colors.onSurface },
  chipRow: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md },
  placeCard: { width: CARD_WIDTH, marginBottom: spacing.sm },
  placeImage: { width: '100%', height: CARD_WIDTH * 1.1, borderRadius: radii.lg },
  placeInfo: { padding: spacing.sm },
  placeName: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface },
  placeRegion: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.onSurfaceVariant },
});
