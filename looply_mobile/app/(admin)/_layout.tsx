import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#2C2C2E",
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "grid" : "grid-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="videos/index"
        options={{
          title: "Videos",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "videocam" : "videocam-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: "Reports",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "flag" : "flag-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ads/index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="videos/video-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile/edit-profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="reports/report-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

