import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export const ErrorScreen = ({ error, onRetry }: ErrorScreenProps) => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <Button
        title="Retry"
        onPress={onRetry}
        variant="primary"
        style={{ marginTop: Spacing.lg }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    textAlign: "center",
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
});

