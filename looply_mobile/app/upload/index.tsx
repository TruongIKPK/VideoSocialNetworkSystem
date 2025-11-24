import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadVideoAsync } from "@/services/uploadService";

export default function UploadScreen() {
  const { uri, type } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState("");

  const mediaUri = Array.isArray(uri) ? uri[0] : uri ?? "";
  const isVideo = type === "video" || type === "video/mp4" || type === "video/quicktime";

  // Video players
  const previewPlayer = useVideoPlayer(isVideo ? mediaUri : null, (player) => {
    if (isVideo) {
      player.loop = true;
      player.pause();
    }
  });

  const fullScreenPlayer = useVideoPlayer(modalVisible && isVideo ? mediaUri : null, (player) => {
    if (isVideo && modalVisible) {
      player.loop = true;
      player.play();
    }
  });

  // Validate mediaUri on mount
  useEffect(() => {
    if (!mediaUri) {
      Alert.alert("Lỗi", "Không tìm thấy file media. Vui lòng thử lại.");
      router.back();
      return;
    }
    
    // Chỉ hỗ trợ video
    if (!isVideo) {
      Alert.alert(
        "Thông báo",
        "Hiện tại chỉ hỗ trợ upload video. Vui lòng chọn video từ thư viện.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [mediaUri, isVideo]);

  const handleUpload = async () => {
    console.log("=".repeat(60));
    console.log("[Upload] 🎬 Bắt đầu quá trình upload video");
    console.log("[Upload] ⏰ Thời gian:", new Date().toISOString());
    
    // Validation
    if (isUploading || !mediaUri) {
      console.log("[Upload] ⚠️ Upload đã đang chạy hoặc không có mediaUri");
      return;
    }
    
    if (!isVideo) {
      console.log("[Upload] ❌ Chỉ hỗ trợ upload video");
      setError("Chỉ hỗ trợ upload video");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      console.log("[Upload] ❌ Thiếu tiêu đề");
      setError("Vui lòng nhập tiêu đề");
      return;
    }

    if (trimmedTitle.length > 100) {
      console.log("[Upload] ❌ Tiêu đề quá dài:", trimmedTitle.length);
      setError("Tiêu đề không được quá 100 ký tự");
      return;
    }

    if (desc.length > 500) {
      console.log("[Upload] ❌ Mô tả quá dài:", desc.length);
      setError("Mô tả không được quá 500 ký tự");
      return;
    }

    // Clear any previous errors
    setError("");
    setIsUploading(true);

    // Determine file extension
    const fileExtension = mediaUri.split('.').pop()?.toLowerCase() || 'mp4';

    console.log("[Upload] ✅ Validation thành công");
    console.log("[Upload] 📝 Thông tin video:");
    console.log("  - Tiêu đề:", trimmedTitle);
    console.log("  - Mô tả:", desc || "(không có)");
    console.log("  - File extension:", fileExtension);
    console.log("  - Media URI:", mediaUri.substring(0, 50) + "...");

    // Show confirmation alert before starting upload
    Alert.alert(
      "Đang tải lên",
      "Video đang được tải lên vui lòng đợi",
      [
        {
          text: "OK",
          onPress: () => {
            console.log("[Upload] 👤 Người dùng xác nhận upload");
            console.log("[Upload] 🚀 Bắt đầu upload video lên server...");
            
            // Start upload asynchronously (don't await)
            uploadVideoAsync({
              title: trimmedTitle,
              description: desc,
              mediaUri,
              fileExtension,
            })
            .then((result) => {
              console.log("[Upload] ✅ Upload hoàn tất từ uploadService");
              console.log("[Upload] 📊 Kết quả:", JSON.stringify(result, null, 2));
            })
            .catch((err) => {
              // Error is already handled in uploadService and notification is sent
              console.error("[Upload] ❌ Lỗi từ uploadService:", err);
            });

            // Navigate away after user confirms
            // Upload will continue in background and notification will be sent when complete
            console.log("[Upload] 🔄 Chuyển đến màn hình profile");
            router.replace("/(tabs)/profile");
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (!mediaUri || !isVideo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!mediaUri ? "Không tìm thấy file" : "Chỉ hỗ trợ upload video"}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* MODAL XEM VIDEO FULL */}
        <Modal
          animationType="fade"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.fullScreenContainer}>
            <SafeAreaView style={styles.fullScreenHeader}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </SafeAreaView>
            {isVideo && (
              <VideoView
                player={fullScreenPlayer}
                style={styles.fullScreenImage}
                allowsFullscreen
              />
            )}
          </View>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <View style={styles.previewContainer}>
              {mediaUri && isVideo ? (
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <VideoView
                    player={previewPlayer}
                    style={styles.preview}
                    allowsFullscreen
                  />
                  <View style={styles.magnifyIcon}>
                    <AntDesign name="arrows-alt" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.previewPlaceholder} />
              )}
            </View>

            <Text style={styles.label}>Tiêu đề: <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, error && !title.trim() && styles.inputError]}
              placeholder="Nhập tiêu đề..."
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError("");
              }}
              editable={!isUploading}
              maxLength={100}
            />
            {title.length > 0 && (
              <Text style={styles.charCount}>{title.length}/100</Text>
            )}

            <Text style={styles.label}>Mô tả:</Text>
            <TextInput
              style={[styles.textarea, error && desc.length > 500 && styles.inputError]}
              placeholder="Viết mô tả (tùy chọn)..."
              value={desc}
              onChangeText={(text) => {
                setDesc(text);
                if (error) setError("");
              }}
              multiline
              editable={!isUploading}
              maxLength={500}
            />
            {desc.length > 0 && (
              <Text style={styles.charCount}>{desc.length}/500</Text>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <AntDesign name="exclamation-circle" size={16} color="#ff4d5a" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  (isUploading || !title.trim()) && styles.uploadBtnDisabled,
                ]}
                onPress={handleUpload}
                disabled={isUploading || !title.trim()}
              >
                <Text style={styles.uploadText}>
                  {isUploading ? "Đang tải..." : "Đăng tải"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, isUploading && styles.cancelBtnDisabled]}
                onPress={() => {
                  if (!isUploading) router.back();
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  topSection: { marginTop: 20 },
  previewContainer: { alignItems: "flex-start", marginBottom: 25 },
  preview: {
    width: 95,
    height: 95,
    borderRadius: 20,
    backgroundColor: "#ccc",
    borderWidth: 1,
    borderColor: "#eee",
  },
  previewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#ccc",
  },
  magnifyIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 4,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  fullScreenHeader: { position: "absolute", top: 20, right: 20, zIndex: 1 },
  closeButton: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  fullScreenImage: { width: "100%", height: "100%" },
  label: { fontWeight: "bold", fontSize: 15, color: "#555", marginBottom: 6 },
  required: { color: "#ff4d5a" },
  charCount: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: -15,
    marginBottom: 10,
  },
  inputError: {
    borderColor: "#ff4d5a",
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe6e6",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorText: {
    color: "#ff4d5a",
    fontSize: 14,
    flex: 1,
  },
  backButton: {
    backgroundColor: "#ff4d5a",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 40,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  textarea: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 150,
    textAlignVertical: "top",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  bottomSection: { marginTop: 20, marginBottom: 20 },
  buttonRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
  uploadBtn: {
    backgroundColor: "#ff4d5a",
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
  },
  uploadBtnDisabled: {
    backgroundColor: "#ff99a0",
    opacity: 0.6,
  },
  uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: {
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelBtnDisabled: {
    opacity: 0.5,
  },
  cancelText: { fontWeight: "bold", fontSize: 16, color: "#000" },
});
