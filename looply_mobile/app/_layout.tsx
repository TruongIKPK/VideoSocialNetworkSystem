import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { AppState, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserProvider } from "@/contexts/UserContext";
import { initDB } from "@/utils/database";

export const unstable_settings = {
  anchor: "(tabs)",
};

export function CustomHeader() {
  return null; // Không hiển thị header vì đã có search button riêng trong home screen
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDB();
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
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Ẩn header ở các màn hình ngoài */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />

          {/* Tabs có header riêng */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>

        {/* Ẩn luôn thanh trạng thái trên cùng */}
        <StatusBar hidden />
      </ThemeProvider>
    </UserProvider>
  );
}
