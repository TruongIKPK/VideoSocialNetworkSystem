import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  Notification,
} from '@/utils/notificationStorage';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    loadNotifications();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Hôm qua';
    if (isThisYear(date)) return format(date, "d 'thg' M", { locale: vi });
    return format(date, 'P', { locale: vi });
  };

  const getNotificationIcon = (type: string, status?: string) => {
    if (type === 'moderation_result') {
      if (status === 'approved') return 'checkmark-circle';
      if (status === 'flagged') return 'flag';
      if (status === 'rejected') return 'close-circle';
    }
    if (type === 'upload_success') return 'cloud-upload';
    return 'notifications';
  };

  const getNotificationColor = (type: string, status?: string) => {
    if (type === 'moderation_result') {
      if (status === 'approved') return '#4CAF50';
      if (status === 'flagged') return '#FF9800';
      if (status === 'rejected') return '#F44336';
    }
    if (type === 'upload_success') return '#2196F3';
    return '#666';
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleMarkAsRead(item.id)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type, item.status) + '20' },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type, item.status)}
            size={24}
            color={getNotificationColor(item.type, item.status)}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <>
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
                  <Ionicons name="checkmark-done" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={24} color="#000" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={loadNotifications}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  unreadItem: {
    backgroundColor: '#f0f8ff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
    marginTop: 4,
  },
});

