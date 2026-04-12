import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { plannersApi } from '../../api/planners';
import type { Agency } from '../../types';

export function AgenciesListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animValues = useRef<Map<string, Animated.Value>>(new Map());

  const getAnim = (id: string) => {
    if (!animValues.current.has(id)) {
      animValues.current.set(id, new Animated.Value(0));
    }
    return animValues.current.get(id)!;
  };

  const animateItem = (id: string, index: number) => {
    const anim = getAnim(id);
    if ((anim as any).__getValue?.() === 0 || (anim as any)._value === 0) {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, index * 80);
    }
  };

  const fetchAgencies = useCallback(
    async (reset = false) => {
      if (isLoading) return;
      const p = reset ? 1 : page;
      if (!reset && !hasMore) return;

      setIsLoading(true);
      try {
        const params: { page: number; q?: string } = { page: p };
        if (search.trim()) params.q = search.trim();

        const response = await plannersApi.getAll(params);
        const raw = response.data;
        const data: Agency[] = Array.isArray(raw) ? raw : (raw as any)?.data ?? [];

        if (reset) {
          animValues.current.clear();
          setAgencies(data);
          setPage(2);
        } else {
          setAgencies((prev) => [...prev, ...data]);
          setPage(p + 1);
        }

        const meta = (raw as any)?.meta;
        setHasMore(meta ? meta.currentPage < meta.totalPages : data.length >= 10);
      } catch {
        // Network error — keep existing data
      } finally {
        setIsLoading(false);
      }
    },
    [page, hasMore, isLoading, search],
  );

  useEffect(() => {
    fetchAgencies(true);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setHasMore(true);
      setPage(1);
      fetchAgencies(true);
    }, 400);
  };

  // Re-fetch when search triggers reset
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const renderAgencyCard = ({ item, index }: { item: Agency; index: number }) => {
    const anim = getAnim(item.id);
    animateItem(item.id, index);

    return (
      <Animated.View
        style={[
          styles.card,
          shadows.soft,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('AgencyDetail', { agencyId: item.id })}
          style={styles.cardInner}
        >
          <Image
            source={{
              uri: item.agencyLogo || item.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <Text style={styles.agencyName} numberOfLines={1}>
                {item.agencyName || item.name}
              </Text>
              {/* TODO: Re-enable verified badge when admin verification is in place
              {item.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
              )} */}
            </View>
            {item.agencyTagline ? (
              <Text style={styles.tagline} numberOfLines={1}>
                {item.agencyTagline}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              {Number(item.averageRating) > 0 && (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Text style={styles.metaText}>{Number(item.averageRating).toFixed(1)}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="bus-outline" size={12} color={colors.outline} />
                <Text style={styles.metaText}>
                  {item.totalTrips ?? 0} {(item.totalTrips ?? 0) === 1 ? 'trip' : 'trips'}
                </Text>
              </View>
              {item.city ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.outline} />
                  <Text style={styles.metaText}>{item.city}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agencies</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search agencies..."
          placeholderTextColor={colors.outline}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={agencies}
        keyExtractor={(item) => item.id}
        renderItem={renderAgencyCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !isLoading) fetchAgencies(false);
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No agencies found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.xl }} />
          ) : (
            <View style={{ height: 100 }} />
          )
        }
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 28,
    color: colors.onSurface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 50,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
  },
  cardInner: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agencyName: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurface,
    flexShrink: 1,
  },
  tagline: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    color: colors.onSurface,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});
