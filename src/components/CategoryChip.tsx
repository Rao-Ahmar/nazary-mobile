import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({ label, selected = false, onPress, style }: CategoryChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected, style]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  chipTextSelected: { color: colors.onPrimary },
});
