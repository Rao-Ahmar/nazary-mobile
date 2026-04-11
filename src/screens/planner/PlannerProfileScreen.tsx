import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../../theme';
import { useAuthStore } from '../../store';

export function PlannerProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
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

      <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditPlannerProfile')}>
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.editText}>Edit Agency Profile</Text>
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
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, paddingTop: spacing.lg, marginBottom: spacing['2xl'] },
  profileCard: { alignItems: 'center', marginBottom: spacing['3xl'] },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.lg, overflow: 'hidden' },
  avatarPlaceholder: { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' } as any,
  name: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface, marginBottom: spacing.xs },
  email: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,88,188,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full },
  roleText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.primary },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, marginBottom: spacing.md },
  editText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.primary },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow },
  logoutText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.error },
});
