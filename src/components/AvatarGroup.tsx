import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface AvatarGroupProps {
  avatars: { uri?: string; name?: string }[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ avatars, max = 4, size = 32 }: AvatarGroupProps) {
  const { colors } = useTheme();
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const borderWidth = 2;
  const totalSize = size + borderWidth * 2;
  const overlap = -10;

  return (
    <View style={styles.container}>
      {visible.map((avatar, i) => (
        <View
          key={i}
          style={[
            styles.avatarWrapper,
            {
              width: totalSize,
              height: totalSize,
              borderRadius: totalSize / 2,
              borderWidth,
              borderColor: colors.surfaceContainerLowest,
              marginLeft: i === 0 ? 0 : overlap,
              zIndex: visible.length - i,
            },
          ]}
        >
          {avatar.uri ? (
            <Image
              source={{ uri: avatar.uri }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
            />
          ) : (
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.surfaceContainerHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={size * 0.45} color={colors.outlineVariant} />
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.avatarWrapper,
            {
              width: totalSize,
              height: totalSize,
              borderRadius: totalSize / 2,
              borderWidth,
              borderColor: colors.surfaceContainerLowest,
              marginLeft: overlap,
              zIndex: 0,
              backgroundColor: colors.surfaceContainerHigh,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: size * 0.35,
              color: colors.onSurfaceVariant,
            }}
          >
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
