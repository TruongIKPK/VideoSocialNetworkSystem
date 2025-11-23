import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { SettingItem } from "./SettingItem";

interface SettingItemData {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "navigation" | "toggle" | "action";
  value?: boolean;
  onPress?: () => void;
}

interface SettingsSectionProps {
  title: string;
  items: SettingItemData[];
}

export function SettingsSection({ title, items }: SettingsSectionProps) {
  const Colors = useColors(); // Get theme-aware colors
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {items.map((item, index) => (
            <SettingItem
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              type={item.type}
              value={item.value}
              onPress={item.onPress}
              showBorder={index < items.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    section: {
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      width: "100%",
    },
    sectionTitle: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: Colors.text.secondary,
      marginBottom: Spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontFamily: Typography.fontFamily.medium,
    },
    card: {
      backgroundColor: Colors.white,
      borderRadius: 0,
      marginHorizontal: 0,
      marginBottom: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border.light,
      paddingVertical: Spacing.lg,
      paddingHorizontal: 0,
    },
    cardContent: {
      paddingHorizontal: Spacing.lg,
      width: "100%",
    },
  });
};

