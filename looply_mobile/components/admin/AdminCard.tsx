import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Typography, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getAvatarUri } from "@/utils/imageHelpers";

interface AdminCardProps {
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
}

export function AdminCard({ name, username, email, avatar }: AdminCardProps) {
  const Colors = useColors(); // Get theme-aware colors
  const displayName = name || username || "Admin";
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View style={styles.adminCard}>
      <View style={styles.adminCardContent}>
        <Image
          source={getAvatarUri(avatar)}
          style={styles.avatar}
        />
        <View style={styles.adminTextContainer}>
          <Text style={styles.adminName}>{displayName}</Text>
          {email && (
            <Text style={styles.adminEmail}>{email}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    adminCard: {
      backgroundColor: Colors.white,
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: Spacing.md,
      borderRadius: 0,
      paddingVertical: Spacing.lg,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    },
    adminCardContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      flex: 1,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.gray[200],
      borderWidth: 2,
      borderColor: Colors.primaryLight,
    },
    adminTextContainer: {
      flex: 1,
      minWidth: 0,
    },
    adminName: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.text.primary,
      fontFamily: Typography.fontFamily.bold,
      flexShrink: 1,
    },
    adminRole: {
      fontSize: Typography.fontSize.sm,
      color: Colors.text.secondary,
      fontFamily: Typography.fontFamily.regular,
      marginTop: 2,
    },
    adminEmail: {
      fontSize: Typography.fontSize.sm,
      color: Colors.text.secondary,
      fontFamily: Typography.fontFamily.regular,
      marginTop: 2,
    },
  });
};

