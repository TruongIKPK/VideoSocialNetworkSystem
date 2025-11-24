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
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const Colors = useColors(); // Get theme-aware colors
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Dark mode state từ theme context
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
            <Text style={styles.headerTitle}>{t("settings.title")}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <SettingsSection title={t("settings.account.title")} items={accountSettings} />

        {/* App Settings */}
        <SettingsSection title={t("settings.app.title")} items={appSettings} />

        {/* Support */}
        <SettingsSection title={t("settings.support.title")} items={supportSettings} />

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
          <Text style={styles.footerText}>{t("settings.footer.adminVersion")}</Text>
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

