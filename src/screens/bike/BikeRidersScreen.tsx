import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Colors, type Shadows } from '../../theme';
import { typography, spacing, radii } from '../../theme';
import { useBikeStore } from '../../store/bikeStore';

export function BikeRidersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const riders = useBikeStore((s) => s.bikeRiders);
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const levelColors = {
    beginner: { bg: colors.successLight, text: colors.success },
    intermediate: { bg: colors.warningLight, text: colors.warning },
    advanced: { bg: colors.primaryTint, text: colors.primary },
  };

  const anims = useRef(riders.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 200 + i * 80);
    });
  }, []);

  const fadeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Bike Riders</Text>
        <Pressable onPress={() => navigation.navigate('BikeProfileSetup')}>
          <Ionicons name="settings-outline" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {riders.map((rider, i) => {
          const lvl = levelColors[rider.experienceLevel] || levelColors.beginner;
          return (
            <Animated.View key={rider.id} style={fadeStyle(anims[i] || new Animated.Value(1))}>
              <View style={[styles.card, shadows.soft]}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: rider.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }} style={styles.avatar} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.name}>{rider.userName}</Text>
                    <View style={[styles.levelBadge, { backgroundColor: lvl.bg }]}>
                      <Text style={[styles.levelText, { color: lvl.text }]}>{rider.experienceLevel}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bikeInfo}>
                  <Ionicons name="bicycle" size={16} color={colors.primary} />
                  <Text style={styles.bikeText}>{rider.bikeModel} ({rider.bikeCc}cc)</Text>
                </View>
                {rider.bio && <Text style={styles.bio} numberOfLines={2}>{rider.bio}</Text>}
              </View>
            </Animated.View>
          );
        })}
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
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginBottom: spacing.xs },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: radii.full, alignSelf: 'flex-start' },
  levelText: { fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 0.3, textTransform: 'capitalize' },
  bikeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  bikeText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurface },
  bio: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
