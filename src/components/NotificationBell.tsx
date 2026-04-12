import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { radii, useTheme, type Colors } from '../theme';
import { useNotificationStore } from '../store/notificationStore';

export function NotificationBell() {
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.container}>
      <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: colors.onError },
});
