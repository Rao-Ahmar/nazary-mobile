import React, { useRef } from 'react';
import { Animated, Easing, ImageStyle } from 'react-native';

interface AnimatedImageProps {
  source: { uri: string };
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

export function AnimatedImage({ source, style, resizeMode = 'cover' }: AnimatedImageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  const handleLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.Image
      source={source}
      style={[style, { opacity }]}
      resizeMode={resizeMode}
      onLoad={handleLoad}
    />
  );
}
