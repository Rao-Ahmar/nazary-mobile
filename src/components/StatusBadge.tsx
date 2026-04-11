import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

const statusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.warningLight, text: colors.warning },
  accepted: { bg: colors.successLight, text: colors.success },
  confirmed: { bg: colors.successLight, text: colors.success },
  rejected: { bg: colors.errorContainer, text: colors.error },
  cancelled: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  active: { bg: colors.successLight, text: colors.success },
  draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
  completed: { bg: 'rgba(0,88,188,0.08)', text: colors.primary },
};

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.full },
  text: { fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 0.3, textTransform: 'capitalize' },
});
