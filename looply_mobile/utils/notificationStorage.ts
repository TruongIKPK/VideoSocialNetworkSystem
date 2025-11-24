import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_STORAGE_KEY = '@notifications';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  videoId?: string;
  status?: string;
  timestamp: string;
  read: boolean;
}

/**
 * Lưu thông báo mới vào storage
 */
export async function saveNotification(notification: Omit<Notification, 'id' | 'read'>): Promise<void> {
  try {
    const notifications = await getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };
    notifications.unshift(newNotification); // Thêm vào đầu danh sách
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

/**
 * Lấy tất cả thông báo
 */
export async function getNotifications(): Promise<Notification[]> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Đánh dấu thông báo là đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Xóa thông báo
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notifications = await getNotifications();
    const updated = notifications.filter(n => n.id !== notificationId);
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

/**
 * Xóa tất cả thông báo
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing all notifications:', error);
  }
}

/**
 * Đếm số thông báo chưa đọc
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const notifications = await getNotifications();
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

