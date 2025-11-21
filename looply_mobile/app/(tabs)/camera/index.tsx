import React, { useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Images } from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

export default function CameraScreen() {
  // 1. Xin quyền Camera và Micro
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<"front" | "back">("back");
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [locking, setLocking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePermission, setImagePermission] = useState<ImagePicker.PermissionStatus | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request image library permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setImagePermission(status);
    })();
  }, []);

  // 2. Logic bộ đếm giờ - Fixed cleanup
  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!cameraPermission || !micPermission) return <View />;

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", marginBottom: 10, color: "#fff" }}>
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
      </SafeAreaView>
    );
  }

  const switchMode = (newMode: "picture" | "video") => {
    if (isRecording) {
      Alert.alert("Thông báo", "Vui lòng dừng quay trước khi chuyển chế độ.");
      return;
    }
    setMode(newMode);
  };

  const pickImage = async () => {
    try {
      // Check permission
      if (imagePermission !== "granted") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setImagePermission(status);
        if (status !== "granted") {
          Alert.alert(
            "Quyền truy cập",
            "Ứng dụng cần quyền truy cập thư viện ảnh để chọn video/ảnh."
          );
          return;
        }
      }

      setIsProcessing(true);
      
      // Mở thư viện, chỉ cho phép chọn Video (vì server chỉ hỗ trợ video)
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Chỉ video
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 300, // Max 5 phút
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate video duration
        if (asset.duration && asset.duration > 300) {
          Alert.alert("Lỗi", "Video không được dài hơn 5 phút.");
          setIsProcessing(false);
          return;
        }

        router.push({
          pathname: "/upload",
          params: {
            uri: asset.uri,
            type: "video",
          },
        });
      }
    } catch (error) {
      console.error("Lỗi chọn video:", error);
      Alert.alert("Lỗi", "Không thể mở thư viện video.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePicture = async () => {
    if (locking || isProcessing) return;
    setLocking(true);
    setIsProcessing(true);
    
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo?.uri) {
          // Server chỉ hỗ trợ video, nên thông báo user
          Alert.alert(
            "Thông báo",
            "Hiện tại chỉ hỗ trợ upload video. Vui lòng chuyển sang chế độ Video để quay.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh:", err);
      Alert.alert("Lỗi", "Không thể chụp ảnh. Vui lòng thử lại.");
    } finally {
      setLocking(false);
      setIsProcessing(false);
    }
  };

  const handleRecordVideo = async () => {
    try {
      if (!isRecording && cameraRef.current) {
        // BẮT ĐẦU QUAY
        setIsRecording(true);
        setIsProcessing(true);

        // Khóa nút trong 1.5 giây để đảm bảo video có độ dài tối thiểu
        setLocking(true);
        const lockTimeout = setTimeout(() => {
          setLocking(false);
        }, 1500);

        try {
          const video = await cameraRef.current.recordAsync({
            maxDuration: 300, // Max 5 phút
          });
          
          clearTimeout(lockTimeout);
          
          if (video?.uri) {
            setIsProcessing(false);
            router.push({
              pathname: "/upload",
              params: { uri: video.uri, type: "video" },
            });
          } else {
            setIsRecording(false);
            setIsProcessing(false);
            setLocking(false);
          }
        } catch (recordErr: any) {
          clearTimeout(lockTimeout);
          setIsRecording(false);
          setIsProcessing(false);
          setLocking(false);
          
          if (recordErr.message?.includes("duration") || recordErr.message?.includes("too short")) {
            Alert.alert("Lỗi", "Video quá ngắn. Vui lòng quay ít nhất 1 giây.");
          } else {
            throw recordErr;
          }
        }
      } else if (cameraRef.current && !locking) {
        // DỪNG QUAY
        setIsProcessing(true);
        cameraRef.current.stopRecording();
        setIsRecording(false);
        // setIsProcessing sẽ được set false khi video được tạo xong
      }
    } catch (err: any) {
      console.error("Lỗi quay video:", err);
      Alert.alert("Lỗi", `Không thể quay video: ${err.message || "Vui lòng thử lại"}`);
      setIsRecording(false);
      setIsProcessing(false);
      setLocking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}>
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

        {isProcessing && !isRecording && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Đang xử lý...</Text>
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
            style={{ opacity: isRecording || isProcessing ? 0.5 : 1 }}
            disabled={isRecording || isProcessing}
            onPress={pickImage}
          >
            <Images size={38} color="#fff" />
          </TouchableOpacity>

          {/* NÚT QUAY/CHỤP */}
          <TouchableOpacity
            onPress={mode === "picture" ? handleTakePicture : handleRecordVideo}
            activeOpacity={0.7}
            disabled={locking} // Disable nút khi đang khóa
          >
            <View
              style={[
                styles.captureBtn,
                mode === "video" && styles.captureBtnVideo,
                isRecording && styles.captureBtnRecording,
                // Làm mờ nút nếu đang bị khóa để bạn biết
                locking && { opacity: 0.5, borderColor: "#999" },
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  timerContainer: {
    position: "absolute",
    top: 20,
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
  topButton: { position: "absolute", top: 20, alignSelf: "center" },
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
    marginTop: 20,
  },
  processingContainer: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
  },
  processingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});
