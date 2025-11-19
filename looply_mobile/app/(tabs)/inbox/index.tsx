import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { IMAGES } from "../../../assets";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import { vi } from "date-fns/locale";
import { SafeAreaView } from 'react-native-safe-area-context';

const messages = [
  {
    id: "1",
    name: "Hin Day Ni",
    message: "Xin chào bạn mình tên là Hiền",
    unread: true,
    time: new Date(2025, 9, 22, 10, 30, 0),
    avatar: IMAGES.defaultAvatar,
  },
  {
    id: "2",
    name: "Hin Day Ni",
    message: "Xin chào lần nữa",
    unread: true,
    time: new Date(),
    avatar: IMAGES.defaultAvatar,
  },
];

function formatChatTime(dateInput: Date | string | number) {
  // Đảm bảo dateInput là một đối tượng Date
  const date = new Date(dateInput);

  if (isToday(date)) {
    // 1. Nếu là hôm nay: "15:50"
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    // 2. Nếu là hôm qua: "Hôm qua"
    return 'Hôm qua';
  }

  if (isThisYear(date)) {
    // 3. Nếu là năm nay (nhưng không phải hôm qua/nay): "22 thg 10"
    return format(date, "d 'thg' M", { locale: vi });
  }

  // 4. Nếu là các năm cũ: "22/10/2024"
  return format(date, 'P', { locale: vi }); 
  // 'P' là viết tắt của 'dd/MM/yyyy' theo locale
}

export default function InboxList() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hộp thư</Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          // Chuyển new Date(item.time) nếu item.time là chuỗi string từ API
          const formattedTime = formatChatTime(item.time);

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/inbox/${item.id}`)}
            >
              <Image source={item.avatar} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.message}>{item.message}</Text>
              </View>
              <View style={styles.right}>
                {item.unread && (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  name: { fontWeight: "bold", fontSize: 16 },
  message: { color: "#555" },
  right: { alignItems: "flex-end" },
  time: { fontSize: 12, color: "#999" },
  badge: {
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  badgeText: { color: "#fff", fontSize: 12 },
});
