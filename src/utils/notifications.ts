import { Platform } from 'react-native';

/**
 * Push notification registration utility.
 * Requires expo-notifications, expo-device, and expo-constants to be installed.
 *
 * Usage:
 *   import { registerForPushNotifications } from '../utils/notifications';
 *   const token = await registerForPushNotifications();
 *   if (token) profileApi.registerDeviceToken(token);
 */

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Dynamically import to avoid crash if packages aren't installed yet
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');

    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch {
    return null;
  }
}
