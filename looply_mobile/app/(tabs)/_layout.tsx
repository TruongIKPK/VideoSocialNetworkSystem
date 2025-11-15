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
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="home" size={28} color={focused ? "#fff" : "#666"} />
          ),
          headerShown: true,
          header: () => <CustomHeader />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: "Explore",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="compass" size={28} color={focused ? "#fff" : "#666"} />
          ),
          headerShown: true,
          header: () => <CustomHeader />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarLabel: "Camera",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="camera" size={30} color={focused ? "#fff" : "#666"} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarLabel: "Inbox",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="chatbubble" size={28} color={focused ? "#fff" : "#666"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="person" size={28} color={focused ? "#fff" : "#666"} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => (
            <Ionicons name="settings" size={28} color={focused ? "#fff" : "#666"} />
          ),
        }}
      />
    </Tabs>
  );
}
