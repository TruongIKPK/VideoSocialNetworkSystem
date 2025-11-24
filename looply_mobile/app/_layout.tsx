import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect, useRef } from "react";
import { AppState, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { HomeReloadProvider } from "@/contexts/HomeReloadContext";
import { initDB } from "@/utils/database";
import * as Notifications from "expo-notifications";
import { requestNotificationPermissions } from "@/utils/notifications";
import { SocketManager } from "@/components/SocketManager";

export const unstable_settings = {
  anchor: "(tabs)",
};

export function CustomHeader() {
  return null; // Không hiển thị header vì đã có search button riêng trong home screen
}

function RootLayoutContent() {
  const { theme } = useTheme();
  
  // Sử dụng theme từ context
  const effectiveTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={effectiveTheme}>
          <Stack>
          {/* Ẩn header ở các màn hình ngoài */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="user/[userId]" options={{ headerShown: false }} />

          {/* Tabs có header riêng */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Admin tabs */}
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />

          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>

        {/* Ẩn luôn thanh trạng thái trên cùng */}
        <StatusBar hidden />
        </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initDB();

    // Request notification permissions on app start
    requestNotificationPermissions();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data?.type === "upload_success") {
        // Navigate to profile when upload success notification is tapped
        // Note: We can't use router here directly, so we'll just log it
        // The user will see the notification and can manually navigate
        console.log("Upload success notification tapped, videoId:", data.videoId);
      }
    });

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // useEffect(() => {
  //   const hideNavBar = async () => {
  //     try {
  //       await NavigationBar.setVisibilityAsync("hidden");
  //     } catch (error) {
  //       console.warn("Failed to hide nav bar:", error);
  //     }
  //   };

  //   hideNavBar(); // chạy khi mở app lần đầu

  //   // chạy lại khi người dùng quay lại app (sau khi thoát)
  //   const subscription = AppState.addEventListener("change", (state) => {
  //     if (state === "active") hideNavBar();
  //   });

  //   return () => subscription.remove();
  // }, []);

  return (
    <UserProvider>
      <SocketManager />
      <ThemeProvider>
        <HomeReloadProvider>
          <RootLayoutContent />
        </HomeReloadProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
