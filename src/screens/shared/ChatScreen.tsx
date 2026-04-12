import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing } from '../../theme';
import type { Colors } from '../../theme';

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.placeholder}>
        <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.outlineVariant} />
        <Text style={styles.placeholderText}>Chat coming soon</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  placeholderText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
