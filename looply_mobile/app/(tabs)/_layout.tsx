import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { CustomHeader } from "../_layout";

import { useUser } from "@/contexts/UserContext";
import { socketService } from "../../service/socketService";

export default function TabLayout() {
  const { user, token } = useUser();

  useEffect(() => {
    // Chỉ kết nối socket cho user thường, không phải admin
    if (token && user?._id && user?.role !== "admin") {
      console.log("🔄 Đang kết nối Socket từ TabLayout...");
      socketService.connect(token);
    } else if (user?.role === "admin") {
      // Nếu là admin, disconnect socket
      console.log("🔌 Admin user detected, disconnecting socket");
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
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home"
              size={28}
              color={focused ? "#fff" : "#B5B5B5"}
            />
          ),
          headerShown: true,
          header: () => <CustomHeader />,
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
          title: "Explore",
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
          title: "Camera",
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
          title: "Inbox",
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
          title: "Profile",
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
