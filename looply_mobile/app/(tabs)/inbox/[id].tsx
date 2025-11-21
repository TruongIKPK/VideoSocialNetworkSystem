import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { initDB, saveMessageToDB, getMessagesFromDB } from "@/utils/database"; // Nhớ sửa đường dẫn import đúng với file bạn tạo ở B2

export default function ChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // id này là ID của người bạn đang chat
  const chatId = typeof id === 'string' ? id : 'unknown';

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // 1. Khởi tạo DB và Load tin nhắn cũ khi vào màn hình
  useEffect(() => {
    initDB(); // Tạo bảng nếu chưa có
    loadMessages();
  }, [chatId]);

  const loadMessages = () => {
    const data = getMessagesFromDB(chatId);
    setMessages(data);
    // Cuộn xuống dưới cùng sau khi load
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  // 2. Xử lý gửi tin nhắn
  const handleSend = () => {
    if (!text.trim()) return;

    // Lưu tin nhắn của MÌNH vào SQLite
    saveMessageToDB(chatId, text.trim(), 'me');
    
    // Load lại list để hiện tin nhắn mới
    loadMessages();
    setText("");

    // [GIẢ LẬP] Người kia trả lời sau 1 giây (Để bạn thấy nó hoạt động)
    // Sau này bạn có thể bỏ đoạn setTimeout này đi
    setTimeout(() => {
      saveMessageToDB(chatId, "Tôi đã nhận được: " + text, 'other');
      loadMessages();
    }, 1000);
  };

  // 3. Giao diện từng dòng tin nhắn
  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={isMe ? styles.rightBubble : styles.leftBubble}>
        {!isMe && (
          <Image
            source={require("../../../assets/images/avatar/example.png")}
            style={styles.smallAvatar}
          />
        )}
        
        <View style={isMe ? styles.rightTextContainer : styles.leftTextContainer}>
          <Text style={isMe ? styles.rightText : styles.leftText}>
            {item.content}
          </Text>
        </View>

        {isMe && (
          <Image
            source={require("../../../assets/images/avatar/example1.png")}
            style={styles.smallAvatar}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={require("../../../assets/images/avatar/example.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>Hin Day Ni (ID: {chatId})</Text>
        </View>

        <View style={styles.divider} />

        {/* Danh sách tin nhắn (Thay ScrollView bằng FlatList) */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Ô nhập tin nhắn */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  divider: { height: 1, backgroundColor: "#ddd" },
  
  messagesList: { padding: 10, paddingBottom: 20 },

  // Style Bong bóng chat
  leftBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: 'flex-start', // Căn trái
    maxWidth: "80%",
  },
  rightBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: 'flex-end', // Căn phải
    justifyContent: 'flex-end',
    maxWidth: "80%",
  },

  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 8,
  },
  
  leftTextContainer: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderBottomLeftRadius: 5, // Tạo góc nhọn
  },
  rightTextContainer: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderBottomRightRadius: 5, // Tạo góc nhọn
  },

  leftText: { color: "#000", fontSize: 16 },
  rightText: { color: "#fff", fontSize: 16 },

  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  sendBtn: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 5
  },
});

// File này là màn hình con của inbox, không phải tab riêng
// Đã được cấu hình trong _layout.tsx với href: null