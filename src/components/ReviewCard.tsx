import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';
import { typography, spacing, radii, useTheme, type Colors, type Shadows } from '../theme';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  style?: ViewStyle;
}

export function ReviewCard({ name, avatar, rating, text, date, style }: ReviewCardProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.card, shadows.soft, style]}>
      <View style={styles.header}>
        <Image
          source={{ uri: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <StarRating rating={rating} size={14} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  headerText: { flex: 1, marginLeft: spacing.md },
  name: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurface },
  date: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  text: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
