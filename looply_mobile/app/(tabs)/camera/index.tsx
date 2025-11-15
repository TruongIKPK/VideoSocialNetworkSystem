import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Images } from "phosphor-react-native";

export default function CameraScreen() {
  // 1. Xin quyền Camera và Micro
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState("back");
  const [mode, setMode] = useState("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const cameraRef = useRef(null);

  // 2. Logic bộ đếm giờ
  useEffect(() => {
    let timer;
    if (isRecording) {
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!cameraPermission || !micPermission) return <View />;

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          Ứng dụng cần quyền truy cập Camera và Microphone 🎥 🎙️
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
          style={styles.permissionBtn}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Cho phép</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const switchMode = (newMode) => {
    if (isRecording) {
      Alert.alert("Thông báo", "Vui lòng dừng quay trước khi chuyển chế độ.");
      return;
    }
    setMode(newMode);
  };

  // --- SỬA ĐOẠN NÀY: Thêm type: 'image' ---
  const handleTakePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          // Gửi thêm type='image' để bên kia biết mà hiển thị
          router.push({
            pathname: "/upload",
            params: { uri: photo.uri, type: "image" },
          });
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể chụp ảnh");
    }
  };

  // --- SỬA ĐOẠN NÀY: Thêm type: 'video' ---
  const handleRecordVideo = async () => {
    try {
      if (!isRecording && cameraRef.current) {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        if (video?.uri) {
          // Gửi thêm type='video'
          router.push({
            pathname: "/upload",
            params: { uri: video.uri, type: "video" },
          });
        }
      } else if (cameraRef.current) {
        cameraRef.current.stopRecording();
        setIsRecording(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể quay video: " + err.message);
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={mode}
      />

      {isRecording && (
        <View style={styles.timerContainer}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatTime(duration)}</Text>
        </View>
      )}

      {!isRecording && (
        <View style={styles.topButton}>
          <TouchableOpacity style={styles.soundBtn}>
            <Text style={styles.soundText}>Thêm âm thanh</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isRecording && (
        <View style={styles.modeSelector}>
          <TouchableOpacity onPress={() => switchMode("video")}>
            <Text
              style={[
                styles.modeText,
                mode === "video" && styles.activeModeText,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchMode("picture")}>
            <Text
              style={[
                styles.modeText,
                mode === "picture" && styles.activeModeText,
              ]}
            >
              Ảnh
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={{ opacity: isRecording ? 0 : 1 }}
          disabled={isRecording}
        >
          <Images size={38} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={mode === "picture" ? handleTakePicture : handleRecordVideo}
        >
          <View
            style={[
              styles.captureBtn,
              mode === "video" && styles.captureBtnVideo,
              isRecording && styles.captureBtnRecording,
            ]}
          >
            {isRecording && <View style={styles.stopIcon} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
          style={{ opacity: isRecording ? 0 : 1 }}
          disabled={isRecording}
        >
          <MaterialCommunityIcons
            name="camera-switch-outline"
            size={38}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  timerContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 8,
  },
  timerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  topButton: { position: "absolute", top: 60, alignSelf: "center" },
  soundBtn: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  soundText: { fontWeight: "bold", color: "#fff" },
  modeSelector: {
    position: "absolute",
    bottom: 140,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
  },
  modeText: { color: "#ccc", fontSize: 16, fontWeight: "600" },
  activeModeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "rgba(50,50,50,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  bottomControls: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  captureBtn: {
    width: 75,
    height: 75,
    borderRadius: 50,
    backgroundColor: "transparent",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnVideo: { borderColor: "#ff4040" },
  captureBtnRecording: {
    borderColor: "#ff4040",
    backgroundColor: "transparent",
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: "#ff4040",
    borderRadius: 4,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  permissionBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
