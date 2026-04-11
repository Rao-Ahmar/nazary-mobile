import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radii } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { useNotificationStore } from '../../store/notificationStore';
import type { AppNotification } from '../../types';

const typeIcons: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  trip_reminder: { name: 'alarm-outline', color: colors.warning, bg: colors.warningLight },
  booking_update: { name: 'ticket-outline', color: colors.success, bg: colors.successLight },
  request_update: { name: 'document-text-outline', color: colors.primary, bg: 'rgba(0,88,188,0.08)' },
  review: { name: 'star-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  general: { name: 'megaphone-outline', color: colors.onSurfaceVariant, bg: colors.surfaceContainer },
  bike_trip: { name: 'bicycle-outline', color: colors.primary, bg: 'rgba(0,88,188,0.08)' },
  trip_update: { name: 'create-outline', color: colors.warning, bg: colors.warningLight },
  new_trip: { name: 'airplane-outline', color: colors.success, bg: colors.successLight },
  preference_match: { name: 'heart-outline', color: colors.error, bg: 'rgba(186,26,26,0.08)' },
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { notifications, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();

  // Fetch real data on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
    }, []),
  );

  const anims = useRef(notifications.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    // Re-create animations when notifications change
    notifications.forEach((_, i) => {
      if (!anims[i]) anims[i] = new Animated.Value(0);
      setTimeout(() => {
        Animated.timing(anims[i], { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 100 + i * 60);
    });
  }, [notifications.length]);

  const fadeStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  const handlePress = (notif: AppNotification) => {
    markAsRead(notif.id);
    // Navigate to trip details if trip_id exists in data
    const tripId = notif.data?.trip_id;
    if (tripId) {
      navigation.navigate('TripDetails', { tripId });
    }
  };

  const renderNotification = (notif: AppNotification, index: number) => {
    const icon = typeIcons[notif.notificationType] || typeIcons.general;
    return (
      <Animated.View key={notif.id} style={fadeStyle(anims[index] || new Animated.Value(1))}>
        <Pressable
          onPress={() => handlePress(notif)}
          style={[styles.card, !notif.read && styles.cardUnread]}
        >
          <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>{notif.title}</Text>
              <Text style={styles.time}>{formatTimeAgo(notif.createdAt)}</Text>
            </View>
            <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
          </View>
          {!notif.read && <View style={styles.unreadDot} />}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markAllRead}>Read All</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <EmptyState icon="notifications-outline" title="No Notifications" message="You're all caught up!" />
        ) : (
          notifications.map((n, i) => renderNotification(n, i))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  markAllRead: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.sm },
  cardUnread: { backgroundColor: 'rgba(0,88,188,0.03)' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, marginLeft: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurface },
  notifTitleUnread: { fontFamily: 'Inter_500Medium' },
  time: { fontFamily: 'Inter_300Light', fontSize: 11, color: colors.onSurfaceVariant },
  notifBody: { ...typography.bodySm, color: colors.onSurfaceVariant },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.sm },
});
