import { Tabs, usePathname, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { CustomHeader } from "../_layout";

import { useUser } from "@/contexts/UserContext";
import { useHomeReload } from "@/contexts/HomeReloadContext";
import { socketService } from "../../service/socketService";
import { saveMessageToDB } from "@/utils/database";

export default function TabLayout() {
  const { user, token } = useUser();
  const { isReloading, triggerReload } = useHomeReload();
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = useSegments();
  const [isHomeFocused, setIsHomeFocused] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const lastTabPressTimeRef = React.useRef<number>(0);
  const TAB_PRESS_DEBOUNCE_MS = 300; // Debounce 0.3 giây (giảm từ 1s để nhanh hơn)
  
  // Track home tab focus state - sử dụng pathname/segments để track
  // Không thể setState trong render, nên dùng useEffect
  useEffect(() => {
    const isOnHome = 
      pathname?.includes('home/index') || 
      (segments && segments.length > 0 && segments[segments.length - 1] === 'home') ||
      pathname === '/(tabs)/home/index' || 
      pathname === '/home/index' || 
      pathname === 'home/index' ||
      (segments && segments.includes('home') && !segments.includes('comments'));
    
    setIsHomeFocused(isOnHome);
    console.log(`[TabLayout] 📍 Pathname: ${pathname}, Segments: ${JSON.stringify(segments)}, isHomeFocused: ${isOnHome}`);
  }, [pathname, segments]);
  
  // Debug: Log reloading state
  useEffect(() => {
    console.log(`[TabLayout] 🔄 isReloading changed: ${isReloading}`);
  }, [isReloading]);
  
  // Animation cho vòng tròn reload
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    if (isReloading) {
      console.log(`[TabLayout] 🎬 Starting reload animation`);
      // Dừng animation cũ nếu có
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      // Reset giá trị về 0
      rotateAnim.setValue(0);
      // Bắt đầu animation quay mới
      animationRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else {
      console.log(`[TabLayout] ⏹️ Stopping reload animation`);
      // Dừng animation nếu đang chạy
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      // Reset giá trị về 0
      rotateAnim.setValue(0);
    }
    
    // Cleanup khi component unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [isReloading, rotateAnim]);
  
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    // Chỉ kết nối socket cho user thường, không phải admin
    if (token && user?._id && user?.role !== "admin") {
      socketService.connect(token);

      const handleGlobalMessage = (msg: any) => {
        console.log("📩 [Global Listener] Có tin nhắn mới:", msg);

        // Chỉ xử lý tin nhắn từ người khác gửi đến
        if (msg.from !== user._id) {
          const incomingMsg = {
            messageId: msg.messageId,
            chatId: msg.from, // ID người gửi chính là ID cuộc trò chuyện
            content: msg.text,
            sender: "other",
            type: msg.type || "text",
            timestamp: msg.timestamp,
            status: "received",
          };

          // 💾 Lưu ngay vào SQLite
          saveMessageToDB(incomingMsg);

          // (Tùy chọn) Tại đây bạn có thể bắn Notification hoặc rung máy
        }
      };

      // Đăng ký sự kiện
      socketService.on("receive-message", handleGlobalMessage);

      // Cleanup khi unmount
      return () => {
        socketService.off("receive-message", handleGlobalMessage);
      };
    } else if (user?.role === "admin") {
      // Nếu là admin, disconnect socket
      socketService.disconnect();
    }

    // Cleanup: disconnect khi component unmount hoặc user thay đổi
    return () => {
      // Không disconnect ở đây vì có thể user chỉ navigate giữa các tab
      // Socket sẽ được quản lý bởi socketService
    };
  }, [token, user?._id, user?.role]); // Chỉ depend vào _id và role, không phải toàn bộ user object

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#666",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopWidth: 0,
          paddingBottom: 30,
          paddingTop: 10,
          height: 100,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused }) => {
            console.log(`[TabLayout] 🎨 Rendering home icon - isReloading: ${isReloading}, focused: ${focused}, isHomeFocused: ${isHomeFocused}`);
            return (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={28}
                  color={focused ? "#fff" : "#B5B5B5"}
                />
                {isReloading && (
                  <Animated.View
                    style={[
                      styles.reloadCircle,
                      {
                        transform: [{ rotate: rotation }],
                      },
                    ]}
                  >
                    <View style={styles.circleBorder}>
                      <Ionicons name="arrow-forward" size={12} color="#fff" style={styles.arrowIcon} />
                    </View>
                  </Animated.View>
                )}
              </View>
            );
          },
          headerShown: true,
          header: () => <CustomHeader />,
        }}
        listeners={{
          tabPress: (e) => {
            const now = Date.now();
            const timeSinceLastPress = now - lastTabPressTimeRef.current;
            
            console.log(`[TabLayout] 👆 Tab press detected on home tab!`);
            console.log(`[TabLayout] Current pathname: ${pathname}`);
            console.log(`[TabLayout] Current segments: ${JSON.stringify(segments)}`);
            console.log(`[TabLayout] isHomeFocused: ${isHomeFocused}`);
            console.log(`[TabLayout] isReloading: ${isReloading}`);
            console.log(`[TabLayout] timeSinceLastPress: ${timeSinceLastPress}ms`);
            
            // Nếu đang ở tab khác, chỉ navigate về home (không reload)
            // Để expo-router tự động navigate, không prevent default
            if (!isHomeFocused) {
              console.log(`[TabLayout] 📍 Currently on different tab, navigating to home (no reload)`);
              // Không prevent default, để expo-router tự động navigate về home
              return;
            }
            
            // Nếu đang ở home tab, prevent default navigation và trigger reload
            console.log(`[TabLayout] 🏠 Currently on home tab, preventing default and triggering reload`);
            e.preventDefault();
            
            // Ngăn trigger nếu đang reload hoặc vừa mới press gần đây
            if (isReloading) {
              console.log(`[TabLayout] ⚠️ Already reloading, skipping`);
              return;
            }
            
            if (timeSinceLastPress < TAB_PRESS_DEBOUNCE_MS) {
              console.log(`[TabLayout] ⚠️ Tab press too soon (${timeSinceLastPress}ms < ${TAB_PRESS_DEBOUNCE_MS}ms), skipping`);
              return;
            }
            
            lastTabPressTimeRef.current = now;
            console.log(`[TabLayout] ✅ Triggering reload`);
            triggerReload();
          },
        }}
      />
      <Tabs.Screen
        name="home/comments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          title: t("tabs.explore"),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="compass"
              size={28}
              color={focused ? "#fff" : "#B5B5B5"}
            />
          ),
          headerShown: true,
          header: () => <CustomHeader />,
        }}
      />
      <Tabs.Screen
        name="camera/index"
        options={{
          title: t("tabs.camera"),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="camera"
              size={32}
              color={focused ? "#fff" : "#B5B5B5"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: t("tabs.inbox"),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="chatbubble"
              size={28}
              color={focused ? "#fff" : "#B5B5B5"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/[id]"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="person"
              size={28}
              color={focused ? "#fff" : "#B5B5B5"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/[userId]"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings/edit-profile"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  reloadCircle: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  circleBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "#fff",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    position: "absolute",
    top: -1,
    right: 6,
  },
});
