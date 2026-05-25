import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radii, useTheme, type Colors } from '../theme';
import type { UserRole } from '../types';

interface RolePickerProps {
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
}

const roles: { key: UserRole; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    key: 'traveler',
    title: 'Traveler',
    desc: 'Discover and book curated travel experiences',
    icon: 'compass-outline',
  },
  {
    key: 'planner',
    title: 'Trip Planner',
    desc: 'Create and manage trips for travelers',
    icon: 'briefcase-outline',
  },
];

export function RolePicker({ selected, onSelect }: RolePickerProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {roles.map((role) => {
        const isSelected = selected === role.key;
        return (
          <Pressable
            key={role.key}
            style={({ pressed }) => [
              styles.card,
              Platform.OS !== 'android' && shadows.soft,
              isSelected && styles.cardSelected,
              pressed && !isSelected && { opacity: 0.7 },
            ]}
            onPress={() => onSelect(role.key)}
            android_ripple={null}
          >
            <View
              style={[
                styles.iconCircle,
                isSelected && styles.iconCircleSelected,
              ]}
            >
              <Ionicons
                name={role.icon}
                size={24}
                color={isSelected ? colors.onPrimary : colors.primary}
              />
            </View>
            <Text style={[styles.title, isSelected && styles.titleSelected]}>
              {role.title}
            </Text>
            <Text style={styles.desc}>{role.desc}</Text>
            {isSelected && (
              <View style={styles.check}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    ...(Platform.OS === 'android' && { overflow: 'hidden' as const }),
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  title: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  titleSelected: {
    color: colors.primary,
  },
  desc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
