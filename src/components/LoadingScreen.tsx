import React, { useMemo } from 'react';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { spacing, useTheme, type Colors } from '../theme';

export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.sm,
  },
});
