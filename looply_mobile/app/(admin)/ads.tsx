import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

export default function AdminAdsScreen() {
  const { user } = useCurrentUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const requestMediaPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Cần quyền truy cập thư viện ảnh để upload quảng cáo."
        );
        return false;
      }
    }
    return true;
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert("Thông báo", "Vui lòng chọn ảnh để đăng tải.");
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual upload to server
      // For now, just show success message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      Alert.alert("Thành công", "Quảng cáo đã được đăng tải thành công!", [
        {
          text: "OK",
          onPress: () => {
            setSelectedImage(null);
          },
        },
      ]);
    } catch (error) {
      console.error("Error uploading ad:", error);
      Alert.alert("Lỗi", "Không thể đăng tải quảng cáo. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info Card */}
        <View style={styles.adminCard}>
          <Image
            source={getAvatarUri(user?.avatar)}
            style={styles.avatar}
          />
          <View style={styles.adminTextContainer}>
            <Text style={styles.adminName}>Admin</Text>
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
          </View>
        </View>

        {/* Ad Creation Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quảng cáo</Text>
          
          {/* Upload Area */}
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.uploadedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload Action Button */}
          <View style={styles.actionContainer}>
            <Button
              title="Đăng tải"
              onPress={handleUpload}
              variant="primary"
              size="md"
              disabled={!selectedImage || isUploading}
              loading={isUploading}
              style={styles.uploadActionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray[200],
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  uploadArea: {
    width: "100%",
    height: 400,
    backgroundColor: "#E5E5E5",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#A0A0A0",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  actionContainer: {
    alignItems: "flex-end",
  },
  uploadActionButton: {
    minWidth: 120,
  },
});

