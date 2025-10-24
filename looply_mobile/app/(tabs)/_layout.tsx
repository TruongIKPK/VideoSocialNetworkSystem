import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#666",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(0,0,0,0.4)",
          borderTopWidth: 0,
          paddingBottom: 25,
          paddingTop: 15,
          height: 80,
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          zIndex: 10,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={28} color={focused ? "#fff" : "#666"} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="compass"
              size={28}
              color={focused ? "#fff" : "#666"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="camera"
              size={32}
              color={focused ? "#fff" : "#666"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="chatbubble"
              size={28}
              color={focused ? "#fff" : "#666"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="person"
              size={28}
              color={focused ? "#fff" : "#666"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
