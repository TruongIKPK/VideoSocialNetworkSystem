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
// Import thêm updateMessageStatus
import {
  initDB,
  saveMessageToDB,
  getMessagesFromDB,
  updateMessageStatus,
} from "@/utils/database";
import { socketService } from "../../../service/socketService";
import { useUser } from "@/contexts/UserContext";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

export default function ChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = typeof id === "string" ? id : "unknown";
  const { user, token } = useUser();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [partner, setPartner] = useState({ name: "Người dùng", avatar: null });
  // State cho typing indicator
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);

  // 1. Lấy thông tin người chat
  useEffect(() => {
    const fetchPartnerInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${chatId}`);
        if (res.ok) setPartner(await res.json());
      } catch (e) {}
    };
    if (chatId.length > 10) fetchPartnerInfo();
  }, [chatId]);

  // 2. Logic Socket & Database
  useEffect(() => {
    initDB();
    loadMessages();

    if (token) socketService.connect(token);

    // --- LẮNG NGHE TIN NHẮN ĐẾN ---
    const handleReceiveMessage = (msg: any) => {
      if (msg.from === chatId) {
        const incomingMsg = {
          messageId: msg.messageId,
          chatId: msg.from,
          content: msg.text,
          sender: "other",
          type: msg.type || "text",
          timestamp: msg.timestamp,
          status: "received", // Mới nhận
        };
        saveMessageToDB(incomingMsg);
        loadMessages();

        // Tự động gửi lại "Đã xem" (Seen)
        socketService.markAsSeen(chatId, msg.messageId);
      }
    };

    // --- LẮNG NGHE NGƯỜI KIA ĐANG NHẬP ---
    const handleTyping = (data: any) => {
      if (data.from === chatId) setIsPartnerTyping(true);
    };

    const handleStopTyping = (data: any) => {
      if (data.from === chatId) setIsPartnerTyping(false);
    };

    // --- LẮNG NGHE NGƯỜI KIA ĐÃ XEM TIN MÌNH ---
    const handleMessageSeen = (data: any) => {
      // Cập nhật DB local: tin nhắn đó chuyển thành "seen"
      updateMessageStatus(data.messageId, "seen");
      loadMessages(); // Reload UI để hiện dấu tick xanh
    };

    socketService.on("receive-message", handleReceiveMessage);
    socketService.on("typing", handleTyping);
    socketService.on("stop-typing", handleStopTyping);
    socketService.on("message-seen", handleMessageSeen);

    return () => {
      socketService.off("receive-message");
      socketService.off("typing");
      socketService.off("stop-typing");
      socketService.off("message-seen");
    };
  }, [chatId]);

  const loadMessages = () => {
    const data = getMessagesFromDB(chatId);
    setMessages(data);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // 3. Xử lý Gửi Tin & Typing
  const handleTextChange = (val: string) => {
    setText(val);

    // Gửi sự kiện "Đang nhập" (Debounce đơn giản)
    if (val.length > 0) {
      socketService.sendTyping(chatId);

      // Clear timeout cũ nếu có
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Sau 2s không gõ nữa thì tự gửi stop-typing
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendStopTyping(chatId);
      }, 2000);
    } else {
      socketService.sendStopTyping(chatId);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;

    const messageId = Date.now().toString();
    const timestamp = Date.now();

    // Lưu DB (status: sent)
    const myMsg = {
      messageId,
      chatId,
      content: text.trim(),
      sender: "me",
      type: "text",
      timestamp,
      status: "sent",
    };
    saveMessageToDB(myMsg);
    loadMessages();
    setText("");
    socketService.sendStopTyping(chatId); // Gửi xong thì tắt typing

    socketService.sendMessage({
      to: chatId,
      text: text.trim(),
      type: "text",
      timestamp,
      messageId,
    });
  };

  // 4. UI Tin nhắn
  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender === "me";
    return (
      <View style={isMe ? styles.rightBubble : styles.leftBubble}>
        {!isMe && (
          <Image
            source={
              partner.avatar
                ? { uri: partner.avatar }
                : require("../../../assets/images/avatar/example.png")
            }
            style={styles.smallAvatar}
          />
        )}
        <View
          style={isMe ? styles.rightTextContainer : styles.leftTextContainer}
        >
          <Text style={isMe ? styles.rightText : styles.leftText}>
            {item.content}
          </Text>

          {/* Hiển thị trạng thái tin nhắn (Chỉ tin của mình) */}
          {isMe && (
            <View style={styles.statusContainer}>
              {item.status === "sending" && (
                <Ionicons name="time-outline" size={12} color="white" />
              )}
              {item.status === "sent" && (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color="white"
                />
              )}
              {/* Đã xem: 2 dấu tick hoặc màu xanh */}
              {item.status === "seen" && (
                <View style={{ flexDirection: "row" }}>
                  <Ionicons name="checkmark-done" size={14} color="#90EE90" />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/inbox")}
          style={{ marginRight: 10, padding: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Image
          source={
            partner.avatar
              ? { uri: partner.avatar }
              : require("../../../assets/images/avatar/example.png")
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {partner.name}
          </Text>
          {/* Hiển thị Typing Indicator */}
          {isPartnerTyping && (
            <Text style={styles.typingText}>Đang nhập...</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 60}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            value={text}
            // Dùng hàm mới để bắt typing
            onChangeText={handleTextChange}
            returnKeyType="send"
            onSubmitEditing={handleSend}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    height: 60,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  name: { fontWeight: "bold", fontSize: 16 },
  typingText: { fontSize: 12, color: "#007AFF", fontStyle: "italic" }, // Style cho chữ Đang nhập...
  divider: { height: 1, backgroundColor: "#ddd" },
  messagesList: { padding: 10, paddingBottom: 20 },
  leftBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  rightBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    maxWidth: "80%",
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 8,
    backgroundColor: "#eee",
  },
  leftTextContainer: {
    backgroundColor: "#E5E5EA",
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 5,
  },
  rightTextContainer: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 15,
    borderBottomRightRadius: 5,
    minWidth: 60,
  },
  leftText: { color: "#000", fontSize: 16 },
  rightText: { color: "#fff", fontSize: 16 },
  statusContainer: { alignSelf: "flex-end", marginTop: 2 }, 
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginBottom: Platform.OS === "android" ? 10 : 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
  },
  sendBtn: { marginLeft: 10, padding: 5 },
});
