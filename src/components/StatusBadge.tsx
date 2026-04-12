import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { radii, useTheme, type Colors } from '../theme';

function getStatusConfig(colors: Colors): Record<string, { bg: string; text: string }> {
  return {
    pending: { bg: colors.warningLight, text: colors.warning },
    accepted: { bg: colors.successLight, text: colors.success },
    confirmed: { bg: colors.successLight, text: colors.success },
    rejected: { bg: colors.errorContainer, text: colors.error },
    cancelled: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
    active: { bg: colors.successLight, text: colors.success },
    draft: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
    completed: { bg: colors.primaryTint, text: colors.primary },
  };
}

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { colors } = useTheme();
  const statusConfig = useMemo(() => getStatusConfig(colors), [colors]);
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
