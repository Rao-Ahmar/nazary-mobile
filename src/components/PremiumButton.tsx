import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radii } from '../theme';

interface PremiumButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  style?: ViewStyle;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function PremiumButton({
  title,
  onPress,
  variant = 'primary',
  style,
  loading,
  icon,
}: PremiumButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale }],
  };

  if (variant === 'tertiary') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.tertiaryText]}>{title}</Text>
          <Animated.View style={styles.underline} />
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[animatedStyle, styles.secondary, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressableInner}
        >
          {icon}
          {loading ? (
            <ActivityIndicator color={colors.onSurface} size="small" />
          ) : (
            <Text style={styles.secondaryText}>{title}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primary}
        >
          {icon}
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    ...typography.labelLg,
    fontFamily: 'Inter_400Regular',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  secondary: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  pressableInner: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    ...typography.labelLg,
    fontFamily: 'Inter_400Regular',
    color: colors.onSurface,
  },
  tertiaryText: {
    ...typography.labelLg,
    fontFamily: 'Inter_400Regular',
    color: colors.primary,
  },
  underline: {
    height: 0.5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
