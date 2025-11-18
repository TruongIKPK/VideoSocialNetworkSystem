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
          position: "absolute",
          backgroundColor: "rgba(0,0,0,0.4)",
          borderTopWidth: 0,
          paddingBottom: 25,
          paddingTop: 15,
          height: 80,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
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
        name="profile"
        options={{
          href: null, 
        }}
      />

      <Tabs.Screen
        name="settings/index"
        options={{
          href: null, 
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
