import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Colors, Typography, Spacing } from "@/constants/theme";
import { AdminCard } from "@/components/admin/AdminCard";
import { SettingItem } from "@/components/admin/SettingItem";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info Card */}
        <AdminCard
          name={user?.name}
          username={user?.username}
          email={user?.email}
          avatar={user?.avatar}
        />

        {/* Profile Actions */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
            
            <SettingItem
              title="Chỉnh sửa hồ sơ"
              subtitle="Cập nhật thông tin cá nhân"
              icon="person-outline"
              type="navigation"
              onPress={() => router.push("/(admin)/profile/edit-profile")}
            />
            <SettingItem
              title="Cài đặt"
              subtitle="Quản lý cài đặt tài khoản"
              icon="settings-outline"
              type="navigation"
              onPress={() => router.push({ pathname: "/(admin)/settings" as any })}
              showBorder={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.gray,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  cardTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
});
