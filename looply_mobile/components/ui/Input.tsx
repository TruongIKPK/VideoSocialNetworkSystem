import React from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "@/constants/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  iconPosition = "left",
  onIconPress,
  containerStyle,
  style,
  ...textInputProps
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon && iconPosition === "left" && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? Colors.error : Colors.gray[400]}
            style={styles.iconLeft}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.gray[400]}
          {...textInputProps}
        />
        {icon && iconPosition === "right" && (
          <TouchableOpacity
            onPress={onIconPress}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon}
              size={20}
              color={error ? Colors.error : Colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});

