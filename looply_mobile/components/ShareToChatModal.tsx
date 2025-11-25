import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInboxConversations, saveMessageToDB } from "@/utils/database"; // Import từ utils của bạn
import { socketService } from "@/service/socketService"; // Import socket
import { VideoPost } from "@/types/video"; // Import type video của bạn

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  video: VideoPost | null;
}

// Item hiển thị người dùng trong danh sách share
const ShareUserItem = ({
  item,
  onSend,
  sentIds,
}: {
  item: any;
  onSend: (id: string) => void;
  sentIds: string[];
}) => {
  const [user, setUser] = useState({ name: "Loading...", avatar: null });
  const isSent = sentIds.includes(String(item.chatId));

  useEffect(() => {
    // Fetch thông tin user để hiển thị Avatar và Tên
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${item.chatId}`);
        if (res.ok) setUser(await res.json());
      } catch (e) {}
    };
    fetchUser();
  }, [item.chatId]);

  return (
    <View style={styles.userItem}>
      <Image
        source={
          user.avatar
            ? { uri: user.avatar }
            : require("@/assets/images/avatar/example.png")
        }
        style={styles.avatar}
      />
      <Text style={styles.userName} numberOfLines={1}>
        {user.name}
      </Text>

      <TouchableOpacity
        style={[styles.sendButton, isSent && styles.sentButton]}
        onPress={() => !isSent && onSend(String(item.chatId))}
        disabled={isSent}
      >
        <Text style={[styles.sendText, isSent && styles.sentText]}>
          {isSent ? "Đã gửi" : "Gửi"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const ShareToChatModal = ({
  visible,
  onClose,
  video,
}: ShareModalProps) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]); // Danh sách ID đã gửi thành công trong phiên này

  useEffect(() => {
    if (visible) {
      // Load danh sách inbox gần đây
      const data = getInboxConversations();
      // Lọc trùng lặp chatId nếu cần
      const uniqueData = data.filter(
        (v, i, a) => a.findIndex((v2) => v2.chatId === v.chatId) === i
      );
      setConversations(uniqueData);
      setSentIds([]); // Reset trạng thái gửi khi mở modal mới
    }
  }, [visible]);

  const handleSendToUser = async (chatId: string) => {
  if (!video) return;

  const timestamp = Date.now();
  const messageId = timestamp.toString();
  
  const specialContent = `VIDEO_SHARE::${video._id}::${video.description || 'Video thú vị'}`;

  const msgData = {
    messageId,
    chatId,
    content: specialContent, // Lưu chuỗi đặc biệt này
    sender: "me",
    type: "text", // Vẫn để text để DB không lỗi
    timestamp,
    status: "sent",
  };

  // 1. Lưu DB
  try {
    await saveMessageToDB(msgData);
    setSentIds(prev => [...prev, chatId]);
  } catch (error) {
    console.log("Lỗi DB:", error);
  }

  // 2. Gửi Socket
  socketService.sendMessage({
    to: chatId,
    text: specialContent, // Gửi chuỗi này đi
    type: 'text',
    timestamp,
    messageId
  });
};

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Chia sẻ tới</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <FlatList
              data={conversations}
              keyExtractor={(item) => item.chatId.toString()}
              renderItem={({ item }) => (
                <ShareUserItem
                  item={item}
                  onSend={handleSendToUser}
                  sentIds={sentIds}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Bạn chưa nhắn tin với ai gần đây.
                </Text>
              }
              contentContainerStyle={{ paddingVertical: 10 }}
            />
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%", // Chiếm 60% màn hình
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  sendButton: {
    backgroundColor: "#FE2C55", // Màu TikTok
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  sentButton: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sentText: {
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
