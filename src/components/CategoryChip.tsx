import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { radii, useTheme, type Colors } from '../theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({ label, selected = false, onPress, style }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected, style]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  chipTextSelected: { color: colors.onPrimary },
});
