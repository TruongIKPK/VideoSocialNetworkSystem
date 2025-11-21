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
import { initDB, saveMessageToDB, getMessagesFromDB } from "@/utils/database";

export default function ChatDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = typeof id === "string" ? id : "unknown";

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initDB();
    loadMessages();
  }, [chatId]);

  const loadMessages = () => {
    const data = getMessagesFromDB(chatId);
    setMessages(data);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    saveMessageToDB(chatId, text.trim(), "me");
    loadMessages();
    setText("");

    setTimeout(() => {
      saveMessageToDB(
        chatId,
        "Ok, tôi đã nhận được tin nhắn: " + text,
        "other"
      );
      loadMessages();
    }, 500);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender === "me";
    return (
      <View style={isMe ? styles.rightBubble : styles.leftBubble}>
        {/* Avatar bên trái (Người khác) */}
        {!isMe && (
          <Image
            source={require("../../../assets/images/avatar/example.png")}
            style={styles.smallAvatar}
          />
        )}
        <View
          style={isMe ? styles.rightTextContainer : styles.leftTextContainer}
        >
          <Text style={isMe ? styles.rightText : styles.leftText}>
            {item.content}
          </Text>
        </View>
        {/* Avatar bên phải (Của mình) */}
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/inbox")}
          style={{ marginRight: 10, padding: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/images/avatar/example.png")}
          style={styles.avatar}
        />
        <Text style={styles.name}>User ID: {chatId}</Text>
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.select({
          ios: 0, 
          android: 0, 
          default: 0,
        })}
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

        {/* Ô nhập tin nhắn */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            value={text}
            onChangeText={setText}
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
    height: 60, // Cố định chiều cao header
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  divider: { height: 1, backgroundColor: "#ddd" },

  messagesList: { padding: 10, paddingBottom: 20 },

  // Bên trái
  leftBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  // Bên phải
  rightBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    maxWidth: "80%",
  },

  // Avatar nhỏ (Sửa lại để khớp với renderItem)
  smallAvatar: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 8 },

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
    backgroundColor: "#fff",
    // Giữ nguyên marginBottom để tránh lỗi trên các dòng máy cũ
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
