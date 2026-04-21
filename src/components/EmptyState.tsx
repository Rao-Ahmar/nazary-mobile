import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, useTheme, type Colors } from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, message, style }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]} accessibilityLabel={`${title}. ${message}`} accessibilityRole="text">
      <Ionicons name={icon} size={48} color={colors.outlineVariant} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  title: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  message: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
