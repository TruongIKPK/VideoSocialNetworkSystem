
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { vi } from "date-fns/locale";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from "react";
import { getInboxConversations } from "@/utils/database"; 
import { Ionicons } from "@expo/vector-icons";

// URL API Backend
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

// Component hiển thị từng dòng tin nhắn (Tự lấy tên User từ Server)
const ConversationItem = ({ item }) => {
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
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [])
  );

  const loadInbox = () => {
    try {
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Hộp thư</Text>
        {/* Nút bấm chuyển sang trang Search */}
        <TouchableOpacity onPress={() => router.push("/search")}>
            <Ionicons name="create-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

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
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.7 },
  emptyText: { color: '#999', fontSize: 18, marginTop: 10, fontWeight: 'bold' },
  emptySubText: { color: '#aaa', fontSize: 14, marginTop: 5 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#eee' },
  name: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  message: { color: "#555", fontSize: 14 },
  right: { alignItems: "flex-end", marginLeft: 10 },
  time: { fontSize: 12, color: "#999" },
});
