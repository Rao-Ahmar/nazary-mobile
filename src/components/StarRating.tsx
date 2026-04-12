import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, useTheme } from '../theme';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  style?: ViewStyle;
}

export function StarRating({ rating, size = 18, interactive = false, onRate, style }: StarRatingProps) {
  const { colors } = useTheme();
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={[styles.container, style]}>
      {stars.map((star) => {
        const filled = star <= rating;
        const StarWrapper = interactive ? Pressable : View;
        return (
          <StarWrapper
            key={star}
            {...(interactive ? { onPress: () => onRate?.(star) } : {})}
            style={styles.star}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? colors.star : colors.outlineVariant}
            />
          </StarWrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: spacing.xs },
});
