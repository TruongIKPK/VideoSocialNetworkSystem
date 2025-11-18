import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatDetail() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/images/avatar/example.png")}
          style={styles.avatar}
        />
        <Text style={styles.name}>Hin Day Ni</Text>
      </View>

      <View style={styles.divider} />

      {/* Nội dung chat */}
      <ScrollView style={styles.messages} showsVerticalScrollIndicator={false}>
        {/* Tin nhắn bên trái */}
        <View style={styles.leftBubble}>
          <Image
            source={require("../../../assets/images/avatar/example.png")}
            style={styles.smallAvatar}
          />
          <View style={styles.leftTextContainer}>
            <Text style={styles.leftText}>Chào bạn! Đây là tin nhắn từ người khác</Text>
          </View>
        </View>

        {/* Tin nhắn bên phải */}
        <View style={styles.rightBubble}>
          <View style={styles.rightTextContainer}>
            <Text style={styles.rightText}>Xin chào! Đây là tin nhắn của bạn 😄</Text>
          </View>
          <Image
            source={require("../../../assets/images/avatar/example1.png")}
            style={styles.smallAvatar}
          />
        </View>

        {/* Thêm ví dụ khác */}
        <View style={styles.leftBubble}>
          <Image
            source={require("../../../assets/images/avatar/example.png")}
            style={styles.smallAvatar}
          />
          <View style={styles.leftTextContainer}>
            <Text style={styles.leftText}>Tin nhắn ngắn</Text>
          </View>
        </View>

        <View style={styles.rightBubble}>
          <View style={styles.rightTextContainer}>
            <Text style={styles.rightText}>OK! 👍</Text>
          </View>
          <Image
            source={require("../../../assets/images/avatar/example1.png")}
            style={styles.smallAvatar}
          />
        </View>
      </ScrollView>

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputArea}>
        <TextInput style={styles.input} placeholder="Nhắn tin..." />
        <TouchableOpacity style={styles.sendBtn}>
          <Ionicons name="send" size={22} color="red" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  divider: { height: 1, backgroundColor: "#ddd" },
  messages: { flex: 1, padding: 10 },

  // Bên trái
  leftBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 3,
    marginRight: 50,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  leftTextContainer: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    maxWidth: "80%",
  },
  leftText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 20,
  },

  // Bên phải
  rightBubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 3,
    marginLeft: 50,
    justifyContent: "flex-end",
  },
  rightTextContainer: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    maxWidth: "80%",
  },
  rightText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
  },

  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
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
  },
});

// File này là màn hình con của inbox, không phải tab riêng
// Đã được cấu hình trong _layout.tsx với href: null