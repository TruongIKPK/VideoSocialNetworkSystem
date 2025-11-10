import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import authService, { validateRegisterForm } from "@/service/authService";

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
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({
        fullName,
        email,
        password,
      });

      if (response.success) {
        Alert.alert("Thành công", response.message, [
          {
            text: "OK",
            onPress: () => router.push("/login"),
          },
        ]);
      } else {
        Alert.alert("Lỗi", response.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đăng kí thất bại. Vui lòng thử lại!");
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
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={errors.fullName ? "#FF3B30" : "#999"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) clearFieldError("fullName");
              }}
              editable={!isLoading}
            />
          </View>
          {errors.fullName ? (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={errors.email ? "#FF3B30" : "#999"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ thư điện tử"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) clearFieldError("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={errors.password ? "#FF3B30" : "#999"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) clearFieldError("password");
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={errors.confirmPassword ? "#FF3B30" : "#999"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) clearFieldError("confirmPassword");
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}

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
          {errors.terms ? (
            <Text style={styles.errorText}>{errors.terms}</Text>
          ) : null}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isLoading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.registerButtonText}>ĐĂNG KÍ</Text>
            )}
          </TouchableOpacity>

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
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 20,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  termsLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  registerButtonDisabled: {
    backgroundColor: "#0051CC",
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  loginLinkText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: "#999",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  chatButton: {
    alignSelf: "center",
  },
  chatButtonText: {
    color: "#999",
    fontSize: 14,
  },
});
