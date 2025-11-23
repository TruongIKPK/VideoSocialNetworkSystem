import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@/constants/theme";

export interface LoadingProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
}

export function Loading({
  message,
  size = "large",
  color = Colors.primary,
  fullScreen = false,
}: LoadingProps) {
  const containerStyle = fullScreen ? styles.fullScreen : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.light,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});

