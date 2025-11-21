import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UploadScreen() {
  const { uri, type } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const mediaUri = Array.isArray(uri) ? uri[0] : uri ?? "";
  const isVideo = type === "video";

  // 1. SỬA LỖI TỰ PHÁT VIDEO
  const player = useVideoPlayer(isVideo ? mediaUri : null, (player) => {
    if (isVideo) {
      player.loop = true;
      player.pause(); // Đổi từ play() thành pause() để không tự chạy
    }
  });

  const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

  const handleUpload = async () => {
    if (isUploading || !mediaUri) return;
    setIsUploading(true);
    setProgress(0);

    try {
      const token = await require("@/utils/tokenStorage").getToken();

      const formData = new FormData();
      formData.append("title", title);

      formData.append("description", desc);

      formData.append("type", type);

      formData.append("file", {
        uri: mediaUri,
        type: "video/mp4",
        name: "upload.mp4",
      } as any);

      // Giả lập loading
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 500);

      console.log("--- ĐANG GỬI ĐẾN: /api/videos/upload ---");

      const response = await fetch(`${API_BASE_URL}/videos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      clearInterval(interval);
      const text = await response.text();
      console.log("STATUS:", response.status);
      console.log("RESPONSE:", text);

      if (response.ok) {
        setProgress(100);
        Alert.alert("Thành công", "Upload xong!");
        router.replace({
          pathname: "/(tabs)/profile/index",
          params: { uploaded: "true" },
        });
      } else {
        // Nếu vẫn lỗi "Must supply api_key" thì LÀ DO SERVER 100%
        Alert.alert("Lỗi Server", text);
        setProgress(0);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Lỗi", "Không kết nối được server");
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MODAL XEM ẢNH FULL */}
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
          <Image
            source={{ uri: mediaUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <View style={styles.topSection}>
        <View style={styles.previewContainer}>
          {mediaUri ? (
            isVideo ? (
              <VideoView
                player={player}
                style={styles.preview}
                fullscreenOptions={{ iOS: { allowsPictureInPicture: true } }}
                allowsPictureInPicture
              />
            ) : (
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.preview}
                  resizeMode="cover"
                />
                <View style={styles.magnifyIcon}>
                  {/* Đã sửa icon enlarge thành arrows-alt */}
                  <AntDesign name="arrows-alt" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.previewPlaceholder} />
          )}
        </View>

        <Text style={styles.label}>Tiêu đề:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tiêu đề..."
          value={title}
          onChangeText={setTitle}
          editable={!isUploading}
        />

        <Text style={styles.label}>Mô tả:</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Viết mô tả..."
          value={desc}
          onChangeText={setDesc}
          multiline
          editable={!isUploading}
        />
      </View>

      <View style={styles.bottomSection}>
        {(isUploading || progress > 0) && (
          <View style={styles.progressContainer}>
            <Text style={styles.fileName}>
              {isVideo ? "video_recording.mp4" : "photo_capture.jpg"}
            </Text>
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
              isUploading && { backgroundColor: "#ff99a0" },
            ]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text style={styles.uploadText}>
              {isUploading ? "Đang tải..." : "Đăng tải"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={isUploading}
          >
            <Text style={styles.cancelText}>Hủy bỏ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
  },
  topSection: { flex: 1, marginTop: 20 },
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
  uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: {
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelText: { fontWeight: "bold", fontSize: 16, color: "#000" },
});
