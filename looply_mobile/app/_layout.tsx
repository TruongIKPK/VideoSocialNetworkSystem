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
import { AppState, View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const unstable_settings = {
  anchor: "(tabs)",
};

export function CustomHeader() {
  return (
    <View
      style={{
        position: "absolute", // nổi lên trên nội dung
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50, // chừa khoảng cho status bar
        paddingBottom: 10,
        backgroundColor: "rgba(0,0,0,0)", // hoàn toàn trong suốt
      }}
    >
      {/* Ô tìm kiếm cũng làm trong suốt hơn */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.1)", // nhẹ nhàng, gần như trong suốt
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingVertical: 8,
          flex: 1,
          marginRight: 15,
        }}
      >
        <TextInput
          style={{ flex: 1, color: "#fff", fontSize: 16 }}
          placeholder="Search"
          placeholderTextColor="#fff"
        />
        <Ionicons
          name="search"
          size={20}
          color="#fff"
          style={{ marginLeft: 10 }}
        />
      </View>

      <TouchableOpacity>
        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const hideNavBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync("overlay-swipe");
      } catch (error) {
        console.warn("Failed to hide nav bar:", error);
      }
    };

    hideNavBar(); // chạy khi mở app lần đầu

    // chạy lại khi người dùng quay lại app (sau khi thoát)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") hideNavBar();
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Ẩn header ở các màn hình ngoài */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />

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
  );
}
