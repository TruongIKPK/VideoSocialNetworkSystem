import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { SignOut } from "phosphor-react-native";

const { height } = Dimensions.get("window");

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt</Text>

      <View style={styles.card}>
        <Text style={styles.item}>Ngôn ngữ</Text>
        <Text style={styles.item}>Chế tối sáng</Text>
        <Text style={styles.item}>Phản hồi và trợ giúp</Text>

        <TouchableOpacity style={styles.logoutRow}>
          <SignOut size={28} color="black" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F1F1",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: height * 0.78, // chiếm ~78% chiều cao màn hình
    marginBottom: 12,
  },
  item: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
