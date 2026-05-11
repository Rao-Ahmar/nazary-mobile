import React, { useRef, useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { useAuthStore } from '../../store';
import type { TripPlanner } from '../../types';
import { TourOverlay, useTourGuide } from '../../components/tour';

export function PlannerProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const planner = user as TripPlanner | null;
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Tour guide
  const profileCardRef = useRef<View>(null);
  const editBtnRef = useRef<View>(null);
  const { tourVisible, tourSteps, completeTour } = useTourGuide(
    'planner_profile',
    [profileCardRef, editBtnRef],
    [
      { id: 'profile', title: 'Your Profile', description: 'View your agency details, social links, and account info', icon: 'person' },
      { id: 'edit', title: 'Edit Agency', description: 'Update your agency name, tagline, logo, and social links', icon: 'create' },
    ],
  );

  const socialLinks: { key: keyof TripPlanner; icon: string; label: string }[] = [
    { key: 'youtubeUrl', icon: 'logo-youtube', label: 'YouTube' },
    { key: 'instagramUrl', icon: 'logo-instagram', label: 'Instagram' },
    { key: 'tiktokUrl', icon: 'logo-tiktok', label: 'TikTok' },
    { key: 'twitterUrl', icon: 'logo-twitter', label: 'X / Twitter' },
    { key: 'websiteUrl', icon: 'globe-outline', label: 'Website' },
  ];

  const activeSocials = socialLinks.filter((s) => {
    const val = planner?.[s.key];
    return typeof val === 'string' && val.length > 0;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Profile</Text>

      <View ref={profileCardRef} collapsable={false} style={styles.profileCard}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={36} color={colors.outlineVariant} />
          </View>
        )}
        <Text style={styles.name}>{user?.name ?? 'Trip Planner'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
          <Text style={styles.roleText}>Trip Planner</Text>
        </View>
      </View>

      {activeSocials.length > 0 && (
        <View style={styles.socialSection}>
          <Text style={styles.socialLabel}>Social Links</Text>
          <View style={styles.socialRow}>
            {activeSocials.map((s) => (
              <Pressable
                key={s.key}
                style={styles.socialIcon}
                onPress={() => Linking.openURL(planner![s.key] as string)}
              >
                <Ionicons name={s.icon as any} size={22} color={colors.onSurfaceVariant} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.themeRow}>
        <View style={styles.themeInfo}>
          <View style={[styles.themeIcon, { backgroundColor: isDark ? colors.primaryTint : colors.warningLight }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.primary : colors.warning} style={{ lineHeight: 18, textAlignVertical: 'center' }} />
          </View>
          <Text style={styles.themeText}>Dark Mode</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
          thumbColor={colors.onPrimary}
        />
      </View>

      <Pressable
        style={styles.rewardsCard}
        onPress={() => navigation.navigate('Rewards')}
      >
        <View style={styles.rewardsInfo}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <View>
            <Text style={styles.rewardsTitle}>Rewards & Referrals</Text>
            <Text style={styles.rewardsPoints}>{user?.points ?? 0} points</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      <Pressable ref={editBtnRef} collapsable={false} style={styles.editButton} onPress={() => navigation.navigate('EditPlannerProfile')}>
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.editText}>Edit Agency Profile</Text>
      </Pressable>

      <Pressable style={styles.aboutButton} onPress={() => navigation.navigate('AboutUs')}>
        <Ionicons name="information-circle-outline" size={20} color={colors.onSurface} />
        <Text style={styles.aboutText}>About Us</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
      <TourOverlay steps={tourSteps} visible={tourVisible} onComplete={completeTour} />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, paddingTop: spacing.lg, marginBottom: spacing['2xl'] },
  profileCard: { alignItems: 'center', marginBottom: spacing['3xl'] },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.lg, overflow: 'hidden' },
  avatarPlaceholder: { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' } as any,
  name: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface, marginBottom: spacing.xs },
  email: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full },
  roleText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  socialSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
  socialLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  socialRow: { flexDirection: 'row', gap: spacing.lg },
  socialIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md },
  themeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  themeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  themeText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  rewardsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.xl, backgroundColor: colors.primaryTint, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md },
  rewardsInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rewardsTitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  rewardsPoints: { fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.primary, marginTop: 2 },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, marginBottom: spacing.md },
  editText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.primary },
  aboutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, marginBottom: spacing.md },
  aboutText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow },
  logoutText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.error },
});
