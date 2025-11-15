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
  Modal, // 1. Import Modal
  SafeAreaView, // Để nút đóng không bị che bởi tai thỏ
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { AntDesign } from "@expo/vector-icons"; // Icon nút đóng

export default function UploadScreen() {
  const { uri, type } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // State cho progress bar
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // 2. State để bật/tắt chế độ xem ảnh full màn hình
  const [modalVisible, setModalVisible] = useState(false);

  const mediaUri = Array.isArray(uri) ? uri[0] : uri ?? "";
  const isVideo = type === "video";

  const player = useVideoPlayer(isVideo ? mediaUri : null, (player) => {
    if (isVideo) {
      player.loop = true;
      player.play();
    }
  });

  const handleUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + Math.random() * 10;
        if (nextProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          Alert.alert("Thành công", "Đã đăng tải nội dung!", [
            { text: "OK", onPress: () => router.back() },
          ]);
          return 100;
        }
        return nextProgress;
      });
    }, 150);
  };

  return (
    <View style={styles.container}>
      {/* --- 3. MODAL XEM ẢNH FULL MÀN HÌNH --- */}
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

          {/* Hiển thị ảnh full trong Modal */}
          <Image
            source={{ uri: mediaUri }}
            style={styles.fullScreenImage}
            resizeMode="contain" // Giữ tỉ lệ ảnh không bị méo
          />
        </View>
      </Modal>
      {/* -------------------------------------- */}

      <View style={styles.topSection}>
        <View style={styles.previewContainer}>
          {mediaUri ? (
            isVideo ? (
              <VideoView
                player={player}
                style={styles.preview}
                allowsFullscreen // Video thì dùng fullscreen có sẵn của player
                allowsPictureInPicture
              />
            ) : (
              // 4. Bọc ảnh bằng TouchableOpacity để bấm vào xem
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.preview}
                  resizeMode="cover"
                />
                {/* Thêm icon kính lúp nhỏ để người dùng biết là bấm vào được */}
                <View style={styles.magnifyIcon}>
                  <AntDesign name="enlarge" size={14} color="#fff" />
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
            <Text
              style={{
                alignSelf: "flex-end",
                fontSize: 12,
                color: "#666",
                marginTop: 4,
              }}
            >
              {Math.round(progress)}%
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  topSection: { flex: 1 },

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

  // Style cho icon kính lúp trên ảnh nhỏ
  magnifyIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 4,
  },

  // --- STYLE CHO MODAL FULLSCREEN ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  fullScreenHeader: { position: "absolute", top: 40, right: 20, zIndex: 1 },
  closeButton: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  fullScreenImage: { width: "100%", height: "100%" },
  // ----------------------------------

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
  bottomSection: { marginTop: 20, marginBottom: 50 },
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
