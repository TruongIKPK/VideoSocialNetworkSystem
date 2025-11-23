import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAvatarUri } from "@/utils/imageHelpers";

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
  const { user, logout } = useUser();
  const { user: currentUser } = useCurrentUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
      id: "edit-profile",
      title: "Chỉnh sửa hồ sơ",
      subtitle: "Cập nhật thông tin cá nhân",
      icon: "person-outline",
      type: "navigation",
      onPress: () => router.push("/(admin)/profile/edit-profile"),
    },
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
      subtitle: "Bật/tắt chế độ tối",
      icon: "moon-outline",
      type: "toggle",
      value: darkModeEnabled,
      onPress: () => setDarkModeEnabled(!darkModeEnabled),
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

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === "toggle") {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.settingItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name={item.icon} size={24} color={Colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: Colors.gray[300], true: Colors.primaryLight }}
            thumbColor={item.value ? Colors.primary : Colors.gray[400]}
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <Ionicons name={item.icon} size={24} color={Colors.primary} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(admin)/profile")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>

        {/* Admin Info Card */}
        <View style={styles.adminCard}>
          <Image
            source={getAvatarUri(currentUser?.avatar)}
            style={styles.avatar}
          />
          <View style={styles.adminTextContainer}>
            <Text style={styles.adminName}>{currentUser?.name || currentUser?.username || "Admin"}</Text>
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
            {currentUser?.email && (
              <Text style={styles.adminEmail}>{currentUser.email}</Text>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <Card>
            {accountSettings.map(renderSettingItem)}
          </Card>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <Card>
            {appSettings.map(renderSettingItem)}
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <Card>
            {supportSettings.map(renderSettingItem)}
          </Card>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.gray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray[200],
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  adminEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Typography.fontFamily.medium,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  settingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
    fontFamily: Typography.fontFamily.regular,
  },
  logoutSection: {
    paddingHorizontal: Spacing.md,
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

