// REMOVED: messaging feature — Nazary v1
// This screen previously showed conversations/messages between travelers and planners.
// Contact between traveler and agency now happens via phone call after request is accepted.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '../theme';
import type { Colors } from '../theme';

export function ConversationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.outline} />
      <Text style={styles.title}>Messaging Removed</Text>
      <Text style={styles.subtitle}>
        Contact with agencies happens via phone call after your trip request is accepted.
      </Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  title: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginTop: spacing.lg },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm },
});
