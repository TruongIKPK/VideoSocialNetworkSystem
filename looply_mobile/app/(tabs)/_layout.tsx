import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { CustomHeader } from "../_layout";

export default function TabLayout() {
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
            <Ionicons name="home" size={28} color={focused ? "#fff" : "#B5B5B5"} />
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
            <Ionicons name="compass" size={28} color={focused ? "#fff" : "#B5B5B5"} />
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
            <Ionicons name="camera" size={32} color={focused ? "#fff" : "#B5B5B5"} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: "Inbox",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="chatbubble" size={28} color={focused ? "#fff" : "#B5B5B5"} />
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
        name="settings/index"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="settings/edit-profile"
        options={{
          href: null, // Ẩn khỏi tab bar
          tabBarStyle: { display: "none" }, // Ẩn tab bar khi ở màn hình này
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="person" size={28} color={focused ? "#fff" : "#B5B5B5"} />
          ),
        }}
      />
    </Tabs>
  );
}
