import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing } from '../../theme';
import { type Colors } from '../../theme';

export function BookingRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Requests</Text>
      <View style={styles.placeholder}>
        <Ionicons name="document-text-outline" size={48} color={colors.outlineVariant} />
        <Text style={styles.placeholderText}>Booking requests coming soon</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.xl },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  placeholderText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
