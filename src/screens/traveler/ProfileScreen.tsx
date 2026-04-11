import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../theme';
import { useAuthStore } from '../../store';
import { NotificationBell } from '../../components/NotificationBell';

export function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile</Text>
        <NotificationBell />
      </View>

      <View style={styles.profileCard}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={36} color={colors.outlineVariant} />
          </View>
        )}
        <Text style={styles.name}>{user?.name ?? 'Traveler'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="compass-outline" size={12} color={colors.primary} />
          <Text style={styles.roleText}>Traveler</Text>
        </View>
      </View>

      <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={20} color={colors.onSurface} />
        <Text style={styles.settingsText}>Notification Settings</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing['2xl'] },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  profileCard: { alignItems: 'center', marginBottom: spacing['3xl'] },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.lg, overflow: 'hidden' },
  avatarPlaceholder: { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' } as any,
  name: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface, marginBottom: spacing.xs },
  email: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,88,188,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full },
  roleText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, marginBottom: spacing.md },
  settingsText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow },
  logoutText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.error },
});
