import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { IMAGES } from "../../../assets";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { vi } from "date-fns/locale";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from "react";
import { getInboxConversations } from "@/utils/database"; 

// 1. Hàm giả lập lấy thông tin User (Vì DB chat hiện tại chỉ lưu ID)
// Sau này bạn có thể thay bằng API call hoặc query từ bảng Users trong SQLite
const getUserInfo = (chatId: string) => {
  const mockUsers: Record<string, any> = {
    "1": { name: "Hin Day Ni", avatar: IMAGES.defaultAvatar },
    "2": { name: "Người lạ ơi", avatar: IMAGES.defaultAvatar },
    // Fallback cho các ID khác
    "default": { name: `User ${chatId}`, avatar: IMAGES.defaultAvatar }
  };
  return mockUsers[chatId] || mockUsers["default"];
};

// 2. Hàm định dạng thời gian thông minh
function formatChatTime(dateInput: number) {
  const date = new Date(dateInput);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    return 'Hôm qua';
  }

  if (isThisYear(date)) {
    return format(date, "d 'thg' M", { locale: vi });
  }

  return format(date, 'P', { locale: vi });
}

export default function InboxList() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. Tự động tải lại danh sách khi màn hình được focus (quay lại từ chat)
  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [])
  );

  const loadInbox = () => {
    try {
      // Lấy tin nhắn mới nhất của từng cuộc trò chuyện từ SQLite
      const data = getInboxConversations();
      setConversations(data);
    } catch (error) {
      console.log("Lỗi load inbox:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hộp thư</Text>

      {loading ? (
        <ActivityIndicator size="large" color="gray" style={{ marginTop: 20 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const userInfo = getUserInfo(item.chatId);
            const formattedTime = formatChatTime(item.timestamp);
            
            const displayMessage = item.sender === 'me' 
              ? `Bạn: ${item.content}` 
              : item.content;

            const isUnread = false; 

            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/(tabs)/inbox/${item.chatId}`)}
              >
                <Image source={userInfo.avatar} style={styles.avatar} />
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, isUnread && styles.unreadText]}>
                    {userInfo.name}
                  </Text>
                  <Text 
                    style={[styles.message, isUnread && styles.unreadText]} 
                    numberOfLines={1}
                  >
                    {displayMessage}
                  </Text>
                </View>
                
                <View style={styles.right}>
                  {isUnread && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>1</Text>
                    </View>
                  )}
                  <Text style={styles.time}>{formattedTime}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 50 
  },
  emptyText: { 
    color: '#999', 
    fontSize: 16 
  },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginVertical: 10 
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    marginRight: 12 
  },
  name: { 
    fontWeight: "bold", 
    fontSize: 16, 
    marginBottom: 4 
  },
  message: { 
    color: "#555", 
    fontSize: 14 
  },
  right: { 
    alignItems: "flex-end", 
    marginLeft: 10 
  },
  time: { 
    fontSize: 12, 
    color: "#999" 
  },
  badge: {
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    paddingHorizontal: 4
  },
  badgeText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "bold" 
  },
  unreadText: {
    fontWeight: "bold",
    color: "#000"
  }
});