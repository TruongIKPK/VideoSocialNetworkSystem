import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import authService, { validateLoginForm } from "@/service/authService";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const router = useRouter();
  const { login } = useUser();

  const handleLogin = async () => {
    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors({ email: validationErrors.email || "", password: validationErrors.password || "" });
      setGeneralError("");
      return;
    }

    setIsLoading(true);
    setGeneralError("");
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.token && response.user) {
        // Update user context
        await login(response.user, response.token);
        // Tự động navigate, không cần thông báo
        router.replace("/(tabs)/home");
      } else {
        setGeneralError(response.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      setGeneralError("Đăng nhập thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn quay trở lại Looply</Text>

          {/* Email Input */}
          <Input
            placeholder="Địa chỉ thư điện tử"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: "" });
              if (generalError) setGeneralError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            icon="mail-outline"
            error={errors.email}
            iconPosition="left"
          />

          {/* Password Input */}
          <Input
            placeholder="Mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: "" });
              if (generalError) setGeneralError("");
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            icon={showPassword ? "eye-off" : "eye"}
            error={errors.password}
            iconPosition="right"
            onIconPress={() => setShowPassword(!showPassword)}
          />

          {/* General Error Message */}
          {generalError ? (
            <Text style={styles.errorText}>{generalError}</Text>
          ) : null}

          {/* Login Button */}
          <Button
            title="ĐĂNG NHẬP"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            style={styles.loginButton}
          />

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => router.push("/register")}
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>Đăng kí tại đây</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
            <Text style={styles.forgotPassword}>Quay về trang chủ</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Lựa chọn khác</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.gray,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.display,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    textAlign: "center",
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    fontFamily: Typography.fontFamily.regular,
  },
  loginButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  forgotPassword: {
    textAlign: "center",
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  registerLink: {
    textAlign: "center",
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontFamily: Typography.fontFamily.regular,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
  },
});
