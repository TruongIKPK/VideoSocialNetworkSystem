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
import { getToken } from "@/utils/tokenStorage";

export default function UploadScreen() {
  const { uri, type } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [progress, setProgress] = useState(0);
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

  const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

  const handleUpload = async () => {
    // Validation
    if (isUploading || !mediaUri) return;
    
    if (!isVideo) {
      setError("Chỉ hỗ trợ upload video");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Tiêu đề không được quá 100 ký tự");
      return;
    }

    if (desc.length > 500) {
      setError("Mô tả không được quá 500 ký tự");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("description", desc.trim());

    // Determine file type and name based on URI
    const fileExtension = mediaUri.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeType = fileExtension === 'mov' ? 'video/quicktime' : 'video/mp4';
    const fileName = `upload.${fileExtension}`;

    formData.append("file", {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    } as any);

    try {
      const token = await getToken();
      
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        router.replace("/(tabs)/profile");
        setIsUploading(false);
        return;
      }

      // Simulate progress (since fetch doesn't support real progress)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Don't go to 100 until upload completes
          return prev + 2;
        });
      }, 300);

      const response = await fetch(`${API_BASE_URL}/videos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });

      clearInterval(interval);

      if (response.ok) {
        setProgress(100);
        const data = await response.json();
        
        // Check moderation status
        const moderationStatus = data.moderationStatus || "pending";
        let alertTitle = "Thành công";
        let alertMessage = "Video đã được đăng!";
        
        if (moderationStatus === "pending") {
          alertTitle = "Video đang được kiểm duyệt";
          alertMessage = data.message || "Video của bạn đang được kiểm duyệt. Bạn sẽ được thông báo khi video được duyệt.";
        } else if (moderationStatus === "flagged" || moderationStatus === "rejected") {
          alertTitle = "Video cần xem xét";
          alertMessage = "Video của bạn cần được xem xét bởi quản trị viên trước khi được hiển thị.";
        }
        
        Alert.alert(alertTitle, alertMessage, [
          {
            text: "OK",
            onPress: () => {
              router.replace({ 
                pathname: "/(tabs)/profile", 
                params: { uploaded: "true" }
              });
            },
          },
        ]);
      } else {
        const errorText = await response.text();
        let errorMessage = "Lỗi khi upload video";
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        setError(errorMessage);
        setProgress(0);
        Alert.alert("Lỗi Server", errorMessage);
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.");
      setProgress(0);
      Alert.alert("Lỗi Mạng", "Kiểm tra kết nối internet");
    } finally {
      setIsUploading(false);
    }
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
            {(isUploading || progress > 0) && (
              <View style={styles.progressContainer}>
                <Text style={styles.fileName}>video_recording.mp4</Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            )}

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
  progressContainer: { marginBottom: 20 },
  fileName: { fontWeight: "600", marginBottom: 8, color: "#111" },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#c7d3d4",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b5557",
    borderRadius: 10,
  },
  progressText: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
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
