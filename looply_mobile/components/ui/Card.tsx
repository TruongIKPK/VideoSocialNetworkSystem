import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";

export interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  shadow?: "sm" | "md" | "lg" | "none";
  borderRadius?: keyof typeof BorderRadius;
}

export function Card({
  children,
  style,
  padding = "cardPadding",
  shadow = "md",
  borderRadius = "card",
}: CardProps) {
  const cardStyle = [
    styles.card,
    { padding: Spacing[padding] },
    { borderRadius: BorderRadius[borderRadius] },
    shadow !== "none" && Shadows[shadow],
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
  },
});

