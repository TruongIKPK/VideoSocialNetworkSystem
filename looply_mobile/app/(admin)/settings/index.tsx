import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { SettingsSection } from "@/components/admin/SettingsSection";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "navigation" | "toggle" | "action";
  value?: boolean;
  onPress?: () => void;
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const Colors = useColors(); // Get theme-aware colors
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Dark mode state từ theme context
  const darkModeEnabled = theme === "dark";
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };


  const accountSettings: SettingItem[] = [
    {
      id: "privacy",
      title: "Quyền riêng tư",
      subtitle: "Kiểm soát quyền riêng tư",
      icon: "lock-closed-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "security",
      title: "Bảo mật",
      subtitle: "Mật khẩu và xác thực",
      icon: "shield-checkmark-outline",
      type: "navigation",
      onPress: () => {},
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: "notifications",
      title: "Thông báo",
      subtitle: "Quản lý thông báo",
      icon: "notifications-outline",
      type: "toggle",
      value: notificationsEnabled,
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      id: "dark-mode",
      title: "Chế độ tối",
      subtitle: darkModeEnabled ? "Đang bật" : "Đang tắt",
      icon: darkModeEnabled ? "moon" : "moon-outline",
      type: "toggle",
      value: darkModeEnabled,
      onPress: async () => {
        console.log(`[Settings] Dark mode toggle pressed. Current: ${darkModeEnabled ? "dark" : "light"}`);
        await toggleTheme();
        console.log(`[Settings] Dark mode toggle completed. New: ${!darkModeEnabled ? "dark" : "light"}`);
      },
    },
    {
      id: "language",
      title: "Ngôn ngữ",
      subtitle: "Tiếng Việt",
      icon: "language-outline",
      type: "navigation",
      onPress: () => {},
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: "help",
      title: "Trợ giúp & Hỗ trợ",
      subtitle: "Câu hỏi thường gặp",
      icon: "help-circle-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "feedback",
      title: "Gửi phản hồi",
      subtitle: "Chia sẻ ý kiến của bạn",
      icon: "chatbubble-ellipses-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "about",
      title: "Về Looply",
      subtitle: "Phiên bản 1.0.0",
      icon: "information-circle-outline",
      type: "navigation",
      onPress: () => {},
    },
  ];


  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(admin)/profile")}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cài đặt</Text>
          </View>
        </View>

        {/* Account Settings */}
        <SettingsSection title="Tài khoản" items={accountSettings} />

        {/* App Settings */}
        <SettingsSection title="Ứng dụng" items={appSettings} />

        {/* Support */}
        <SettingsSection title="Hỗ trợ" items={supportSettings} />

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Đăng xuất"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Looply Admin v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
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
    header: {
      backgroundColor: Colors.white,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
      paddingVertical: Spacing.md,
      paddingHorizontal: 0,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
    },
    backButton: {
      marginRight: Spacing.md,
    },
    headerTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.text.primary,
      fontFamily: Typography.fontFamily.bold,
    },
    logoutSection: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    logoutButton: {
      marginTop: Spacing.md,
    },
    footer: {
      alignItems: "center",
      paddingVertical: Spacing.xl,
    },
    footerText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.text.tertiary,
      fontFamily: Typography.fontFamily.regular,
    },
  });
};

