import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Colors } from '../../theme';
import { typography, spacing, radii } from '../../theme';
import { useBikeStore } from '../../store/bikeStore';

export function PremiumPaywallScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { setPremium } = useBikeStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const handleDevBypass = () => {
    setPremium(true);
    navigation.replace('BikeTrips');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={colors.onSurface} />
      </Pressable>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.iconGradient}>
            <Ionicons name="bicycle" size={48} color={colors.onPrimary} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Premium Bike Trips</Text>
        <Text style={styles.subtitle}>Unlock exclusive motorcycle adventures across Pakistan</Text>

        <View style={styles.features}>
          {[
            { icon: 'map-outline' as const, text: 'Access premium bike trip listings' },
            { icon: 'people-outline' as const, text: 'Connect with fellow riders' },
            { icon: 'shield-checkmark-outline' as const, text: 'Verified routes & safety info' },
            { icon: 'star-outline' as const, text: 'Priority booking on popular rides' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.comingSoon}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.comingSoonText}>Payment integration coming soon!</Text>
        </View>

        {__DEV__ && (
          <Pressable onPress={handleDevBypass} style={styles.devButton} accessibilityLabel="Dev bypass unlock premium" accessibilityRole="button">
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.devGradient}>
              <Text style={styles.devText}>Dev Bypass - Unlock Premium</Text>
            </LinearGradient>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  closeButton: { position: 'absolute', right: spacing.xl, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  iconContainer: { marginBottom: spacing['2xl'] },
  iconGradient: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Manrope_300Light', fontSize: 28, color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing['2xl'] },
  features: { alignSelf: 'stretch', marginBottom: spacing['2xl'] },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  featureText: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
  comingSoon: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.warningLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.xl, marginBottom: spacing.xl },
  comingSoonText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.warning },
  devButton: { alignSelf: 'stretch' },
  devGradient: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  devText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
});
