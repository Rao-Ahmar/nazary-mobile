import React, { useRef, useState } from 'react';
import { Animated, Easing, ImageStyle, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface AnimatedImageProps {
  source: { uri: string };
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

export function AnimatedImage({ source, style, resizeMode = 'cover' }: AnimatedImageProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [hasError, setHasError] = useState(false);
  const { colors } = useTheme();

  const handleLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  if (hasError) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surfaceContainerHigh }, style as any]}>
        <Ionicons name="image-outline" size={32} color={colors.outlineVariant} />
      </View>
    );
  }

  return (
    <Animated.Image
      source={source}
      style={[style, { opacity }]}
      resizeMode={resizeMode}
      onLoad={handleLoad}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
