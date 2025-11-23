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
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import authService, { validateRegisterForm } from "@/service/authService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });
  const [generalError, setGeneralError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    // Validate form
    const validationErrors = validateRegisterForm(
      fullName,
      email,
      password,
      confirmPassword,
      agreeTerms
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors({
        fullName: validationErrors.fullName || "",
        email: validationErrors.email || "",
        password: validationErrors.password || "",
        confirmPassword: validationErrors.confirmPassword || "",
        terms: validationErrors.terms || "",
      });
      setGeneralError("");
      return;
    }

    setIsLoading(true);
    setGeneralError("");
    try {
      const response = await authService.register({
        fullName,
        email,
        password,
      });
      
      if (response.success) {
        // Tự động navigate, không cần thông báo
        router.replace("/login");
      } else {
        setGeneralError(response.message || "Đăng kí thất bại");
      }
    } catch (error) {
      setGeneralError("Đăng kí thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    setErrors({ ...errors, [field]: "" });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.title}>Xin chào!</Text>
          <Text style={styles.subtitle}>
            Hãy đăng kí tài khoản Looply tại đây!
          </Text>

          {/* Full Name Input */}
          <Input
            placeholder="Họ và tên"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) clearFieldError("fullName");
              if (generalError) setGeneralError("");
            }}
            editable={!isLoading}
            icon="person-outline"
            error={errors.fullName}
            iconPosition="left"
          />

          {/* Email Input */}
          <Input
            placeholder="Địa chỉ thư điện tử"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) clearFieldError("email");
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
              if (errors.password) clearFieldError("password");
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            icon={showPassword ? "eye-off" : "eye"}
            error={errors.password}
            iconPosition="right"
            onIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Confirm Password Input */}
          <Input
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) clearFieldError("confirmPassword");
            }}
            secureTextEntry={!showConfirmPassword}
            editable={!isLoading}
            icon={showConfirmPassword ? "eye-off" : "eye"}
            error={errors.confirmPassword}
            iconPosition="right"
            onIconPress={() => setShowConfirmPassword((prev) => !prev)}
          />

          {/* Terms Agreement */}
          <View style={styles.termsContainer}>
            <Checkbox
              value={agreeTerms}
              onValueChange={(value) => {
                setAgreeTerms(value);
                if (errors.terms) clearFieldError("terms");
              }}
              disabled={isLoading}
              style={styles.checkbox}
              color={agreeTerms ? "#007AFF" : undefined}
            />
            <Text style={styles.termsText}>
              Tôi đồng ý với{" "}
              <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{" "}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </View>
          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}

          {/* General Error Message */}
          {generalError ? (
            <Text style={styles.errorText}>{generalError}</Text>
          ) : null}

          {/* Register Button */}
          <Button
            title="ĐĂNG KÍ"
            onPress={handleRegister}
            variant="primary"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Lựa chọn khác</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
  registerButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.regular,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  loginLinkText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
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
    marginBottom: Spacing.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  chatButton: {
    alignSelf: "center",
  },
  chatButtonText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
  },
  forgotPassword: {
    marginTop: Spacing.sm,
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    textAlign: "center",
    fontFamily: Typography.fontFamily.regular,
  },
});
