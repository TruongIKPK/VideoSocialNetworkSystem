import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { saveNotification } from './notificationStorage';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 * @returns {Promise<boolean>} True if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // For Android, we need to set the notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data to attach to notification
 * @returns {Promise<string>} Notification ID
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> {
  try {
    console.log("=".repeat(60));
    console.log("[Notifications] 📤 Scheduling notification...");
    console.log(`[Notifications] Title: "${title}"`);
    console.log(`[Notifications] Body: "${body}"`);
    console.log(`[Notifications] Data:`, JSON.stringify(data || {}, null, 2));

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('[Notifications] ⚠️ Cannot send notification: permissions not granted');
      console.log("=".repeat(60));
      return '';
    }

    console.log('[Notifications] ✅ Notification permissions granted');

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });

    if (notificationId) {
      console.log(`[Notifications] ✅ Notification scheduled successfully!`);
      console.log(`[Notifications] Notification ID: ${notificationId}`);
      
      // Lưu thông báo vào storage để hiển thị trong danh sách
      await saveNotification({
        title,
        body,
        type: data?.type || 'general',
        videoId: data?.videoId,
        status: data?.status,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn('[Notifications] ⚠️ Notification scheduled but no ID returned');
    }
    console.log("=".repeat(60));
    return notificationId;
  } catch (error) {
    console.error("=".repeat(60));
    console.error('[Notifications] ❌ Error scheduling notification:', error);
    console.error('[Notifications] Error details:', JSON.stringify(error, null, 2));
    console.log("=".repeat(60));
    return '';
  }
}

/**
 * Cancel a notification by ID
 * @param {string} notificationId - Notification ID to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get notification permissions status
 * @returns {Promise<Notifications.NotificationPermissionsStatus>}
 */
export async function getNotificationPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.getPermissionsAsync();
}

