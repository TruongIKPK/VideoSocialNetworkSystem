import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUser } from "@/contexts/UserContext";
import { Typography, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "navigation" | "toggle" | "action";
  value?: boolean;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const Colors = useColors(); // Get theme-aware colors
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const darkModeEnabled = theme === "dark";
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const handleLogout = () => {
    Alert.alert(
      t("settings.logout.confirmTitle"),
      t("settings.logout.confirmMessage"),
      [
        {
          text: t("settings.logout.cancel"),
          style: "cancel",
        },
        {
          text: t("settings.logout.confirm"),
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
      title: t("settings.account.editProfile"),
      subtitle: t("settings.account.editProfileSubtitle"),
      icon: "person-outline",
      type: "navigation",
      onPress: () => router.push("/(tabs)/settings/edit-profile"),
    },
    {
      id: "privacy",
      title: t("settings.account.privacy"),
      subtitle: t("settings.account.privacySubtitle"),
      icon: "lock-closed-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "security",
      title: t("settings.account.security"),
      subtitle: t("settings.account.securitySubtitle"),
      icon: "shield-checkmark-outline",
      type: "navigation",
      onPress: () => {},
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: "notifications",
      title: t("settings.app.notifications"),
      subtitle: t("settings.app.notificationsSubtitle"),
      icon: "notifications-outline",
      type: "toggle",
      value: notificationsEnabled,
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      id: "dark-mode",
      title: t("settings.app.darkMode"),
      subtitle: darkModeEnabled ? t("settings.app.darkModeOn") : t("settings.app.darkModeOff"),
      icon: darkModeEnabled ? "moon" : "moon-outline",
      type: "toggle",
      value: darkModeEnabled,
      onPress: async () => {
        await toggleTheme();
      },
    },
    {
      id: "language",
      title: t("settings.app.language"),
      subtitle: i18n.language === "vi" ? t("settings.app.languageSubtitle") : "English",
      icon: "language-outline",
      type: "navigation",
      onPress: () => {
        const newLang = i18n.language === "vi" ? "en" : "vi";
        i18n.changeLanguage(newLang);
      },
    },
    {
      id: "data-usage",
      title: t("settings.app.dataUsage"),
      subtitle: t("settings.app.dataUsageSubtitle"),
      icon: "cellular-outline",
      type: "navigation",
      onPress: () => {},
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: "help",
      title: t("settings.support.help"),
      subtitle: t("settings.support.helpSubtitle"),
      icon: "help-circle-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "feedback",
      title: t("settings.support.feedback"),
      subtitle: t("settings.support.feedbackSubtitle"),
      icon: "chatbubble-ellipses-outline",
      type: "navigation",
      onPress: () => {},
    },
    {
      id: "about",
      title: t("settings.support.about"),
      subtitle: t("settings.support.aboutSubtitle"),
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userCardContent}>
              <View style={styles.userInfo}>
                <Ionicons name="person-circle" size={48} color={Colors.primary} />
                <View style={styles.userText}>
                  <Text style={styles.userName}>{user.name || user.username || "User"}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.account.title")}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsCardContent}>
              {accountSettings.map(renderSettingItem)}
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.app.title")}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsCardContent}>
              {appSettings.map(renderSettingItem)}
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.support.title")}</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsCardContent}>
              {supportSettings.map(renderSettingItem)}
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title={t("settings.logout.title")}
            onPress={handleLogout}
            variant="danger"
            fullWidth
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("settings.footer.appVersion")}</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    marginHorizontal: 0,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  userCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  userCardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
    fontFamily: Typography.fontFamily.regular,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
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
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
  },
  settingsCardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
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
