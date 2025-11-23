import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useUser } from "@/contexts/UserContext";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AdminEditProfileScreen() {
  const router = useRouter();
  const { user, token, login } = useUser();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      // getAvatarUri trả về object { uri: string }, cần lấy uri
      if (user.avatar) {
        const avatarUri = getAvatarUri(user.avatar);
        setAvatar(avatarUri.uri);
      } else {
        setAvatar(null);
      }
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập", "Cần quyền truy cập thư viện ảnh để chọn avatar");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        // Tạo file object từ URI để upload
        const filename = result.assets[0].uri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        
        setAvatarFile({
          uri: result.assets[0].uri,
          name: filename,
          type: type,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại!");
    }
  };

  const handleSubmit = async () => {
    if (!user?._id || !token) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
      return;
    }

    if (!name.trim() || !username.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ tên và username");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("username", username.trim());
      if (bio.trim()) {
        formData.append("bio", bio.trim());
      }
      if (avatarFile) {
        // React Native FormData format
        formData.append("avatar", {
          uri: avatarFile.uri,
          name: avatarFile.name,
          type: avatarFile.type,
        } as any);
      }

      const response = await fetch(
        `${API_BASE_URL}/users/profile/${user._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Không set Content-Type, FormData sẽ tự set với boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      const updatedUser = await response.json();
      
      // Cập nhật user data trực tiếp từ response, không gọi refreshUser để tránh mất token
      if (updatedUser && user && token) {
        // Cập nhật user trong context mà không cần gọi API lại
        const updatedUserData = {
          ...user,
          name: updatedUser.name || user.name,
          username: updatedUser.username || user.username,
          bio: updatedUser.bio !== undefined ? updatedUser.bio : user.bio,
          avatar: updatedUser.avatar || user.avatar,
        };
        
        // Cập nhật user và lưu vào AsyncStorage (login function sẽ làm điều này)
        await login(updatedUserData, token);
      }
      
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!", [
        {
          text: "OK",
          onPress: () => router.replace("/(admin)/profile"),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", error.message || "Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(admin)/profile")}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={64} color={Colors.gray[400]} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Nhấn để thay đổi avatar</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Tên"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên của bạn"
            autoCapitalize="words"
            style={styles.textInput}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Nhập username"
            autoCapitalize="none"
            style={styles.textInput}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Giới thiệu về bản thân"
            multiline
            numberOfLines={4}
            style={styles.bioInput}
            containerStyle={styles.inputContainer}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Lưu thay đổi"
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.gray,
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingVertical: Spacing.md,
    paddingHorizontal: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[200],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.md,
  },
  avatarHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  textInput: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    paddingVertical: Spacing.sm,
    textAlignVertical: "center",
    textAlign: "left",
    width: "100%",
    height: 50,
    minHeight: 50,
  },
  bioInput: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    minHeight: 100,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    width: "100%",
  },
});
