import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { vi } from "date-fns/locale";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { socketService } from "@/service/socketService";
import { useUser } from "@/contexts/UserContext";
import { getAvatarUri } from "@/utils/imageHelpers";
import { getInboxConversations, markMessagesAsSeen } from "@/utils/database";
import { NotificationModal } from "@/components/NotificationModal";
import { getUnreadCount } from "@/utils/notificationStorage";

// URL API Backend
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface Conversation {
  id: string | number;
  chatId: string;
  content: string;
  sender: string;
  timestamp: string;
  status: string;
}

const ConversationItem = ({ item, onOpenChat, isOnline }: { item: Conversation; onOpenChat: (chatId: string) => void; isOnline: boolean }) => {
  const [userInfo, setUserInfo] = useState({ name: "Đang tải...", avatar: null });
  
  useEffect(() => {
    // Nếu chatId là số (1, 2...) do lúc test cũ -> Bỏ qua không gọi API để đỡ lỗi
    if (item.chatId.length < 10) {
        setUserInfo({ name: `User Test ${item.chatId}`, avatar: null });
        return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${item.chatId}`);
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
        } else {
            setUserInfo({ name: "Người dùng không tồn tại", avatar: null });
        }
      } catch (e) {
        setUserInfo({ name: "Lỗi tải tên", avatar: null });
      }
    };
    fetchUser();
  }, [item.chatId]);

  // Format thời gian
  const formattedTime = (() => {
      const date = new Date(item.timestamp);
      if (isToday(date)) return format(date, 'HH:mm');
      if (isYesterday(date)) return 'Hôm qua';
      if (isThisYear(date)) return format(date, "d 'thg' M", { locale: vi });
      return format(date, 'P', { locale: vi });
  })();

  const displayMessage = item.sender === 'me' ? `Bạn: ${item.content}` : item.content;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(tabs)/inbox/${item.chatId}`)}
    >
      <Image 
        source={userInfo.avatar ? { uri: userInfo.avatar } : require("../../../assets/images/avatar/example.png")} 
        style={styles.avatar} 
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{userInfo.name}</Text>
        <Text style={styles.message} numberOfLines={1}>{displayMessage}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function InboxList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({}); // State lưu list online
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useUser();
  const isNavigatingRef = useRef(false);

  const loadInbox = useCallback(() => {
    try {
      const data = getInboxConversations() as Conversation[];
      const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setConversations(sortedData);
    } catch (error) {
      console.log("Lỗi load inbox:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInbox();
      loadUnreadCount();
    }, [loadInbox, loadUnreadCount])
  );

  useFocusEffect(
    useCallback(() => {
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }
      const timeout = setTimeout(() => loadInbox(), 200);
      return () => clearTimeout(timeout);
    }, [loadInbox])
  );

  useEffect(() => {
    if (!token) return;

    socketService.connect(token);

    // 1. Logic nhận tin nhắn mới
    const handleNewMessage = (message) => {
      console.log("📨 Socket: Tin nhắn mới");
      setTimeout(() => loadInbox(), 1000);
    };

    // 2. Logic đánh dấu đã đọc
    const handleMessageSeen = ({ seenBy }) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (String(conv.chatId) === String(seenBy)) {
            return { ...conv, status: "seen", unreadCount: 0 };
          }
          return conv;
        })
      );
    };

    // --- LOGIC ONLINE/OFFLINE ---

    // 3. ✨ MỚI: Nhận danh sách toàn bộ user đang online khi mới connect
    const handleGetOnlineUsers = (userIds) => {
      // userIds là mảng id, ví dụ: ["id1", "id2"]
      const onlineMap = {};
      userIds.forEach((id) => {
        onlineMap[String(id)] = true;
      });
      setOnlineUsers(onlineMap);
    };

    // 4. Ai đó vừa online
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [String(userId)]: true }));
    };

    // 5. Ai đó vừa offline
    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const newState = { ...prev };
        delete newState[String(userId)];
        return newState;
      });
    };

    
    // Lắng nghe sự kiện
    socketService.on("receive-message", handleNewMessage);
    socketService.on("message-seen", handleMessageSeen);
    
    // 👇 Sự kiện Online
    socketService.on("get-online-users", handleGetOnlineUsers); // <-- Server cần emit cái này khi client connect
    socketService.on("user-online", handleUserOnline);
    socketService.on("user-offline", handleUserOffline);

    return () => {
      socketService.off("receive-message", handleNewMessage);
      socketService.off("message-seen", handleMessageSeen);
      socketService.off("get-online-users", handleGetOnlineUsers);
      socketService.off("user-online", handleUserOnline);
      socketService.off("user-offline", handleUserOffline);
    };
  }, [token, loadInbox]);

  const handleOpenChat = async (chatId) => {
    isNavigatingRef.current = true;
    setConversations((prev) =>
      prev.map((c) => (String(c.chatId) === String(chatId) ? { ...c, status: "seen" } : c))
    );
    try {
      await markMessagesAsSeen(chatId); 
    } catch (error) {
      console.log("❌ Lỗi update DB:", error);
    }
    router.push(`/(tabs)/inbox/${chatId}`);
  };

  // Reload unread count khi modal đóng
  const handleNotificationModalClose = () => {
    setNotificationModalVisible(false);
    loadUnreadCount();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Hộp thư</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => router.push("/search")}>
            <Ionicons name="create-outline" size={28} color="black" />
          </TouchableOpacity>
          {/* Icon thông báo */}
          <TouchableOpacity 
            onPress={() => setNotificationModalVisible(true)}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={28} color="black" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={handleNotificationModalClose}
      />

      {loading ? (
        <ActivityIndicator size="large" color="gray" style={{ marginTop: 20 }} />
      ) : conversations.length === 0 ? (
        // Giao diện khi trống
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
          <Text style={styles.emptySubText}>Bấm vào nút cây bút để tìm bạn bè</Text>
        </View>
      ) : (
        // Danh sách tin nhắn
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => <ConversationItem item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5
  },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  emptyContainer: { alignItems: "center", marginTop: 100, opacity: 0.7 },
  emptyText: { color: "#999", fontSize: 18, marginTop: 10, fontWeight: "bold" },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  
  avatarContainer: { marginRight: 12, position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#eee", borderWidth: 1, borderColor: "#f0f0f0" },
  
  // Style cho chấm xanh (Nút online)
  onlineIndicator: {
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 14, 
    height: 14, 
    borderRadius: 7,
    backgroundColor: '#31A24C', // Màu xanh lá Messenger
    borderWidth: 2, 
    borderColor: '#fff', 
    zIndex: 99, 
    elevation: 5, // Đổ bóng cho Android nổi lên
  },

  name: { fontSize: 16, marginBottom: 4, color: "#000", fontWeight: "normal" },
  nameUnread: { fontWeight: "bold" },
  message: { color: "#666", fontSize: 14, fontWeight: "normal" },
  messageUnread: { fontWeight: "bold", color: "#000" },
  right: { alignItems: "flex-end", marginLeft: 10, minWidth: 50 },
  time: { fontSize: 12, color: "#999" },
  unreadDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#007AFF", marginTop: 6 },
  
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
