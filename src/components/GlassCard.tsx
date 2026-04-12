import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radii, useTheme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({ children, style, intensity = 40, tint }: GlassCardProps) {
  const { isDark } = useTheme();
  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={resolvedTint} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  inner: {
    padding: 20,
  },
});
