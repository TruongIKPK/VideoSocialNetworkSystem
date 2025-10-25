import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { CameraViewRef } from "expo-camera";
import { Images, Aperture } from "phosphor-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef<CameraViewRef>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          Ứng dụng cần quyền truy cập Camera 🎥
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Cho phép</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        console.log("Ảnh đã chụp:", photo?.uri);

        if (photo?.uri) {
          router.push({
            pathname: "/upload",
            params: { uri: photo.uri },
          });
        }
      }
    } catch (err) {
      console.error("Lỗi khi chụp ảnh:", err);
      Alert.alert("Lỗi", "Không thể chụp ảnh, vui lòng thử lại!");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setIsReady(true)}
      />

      {/* 🔹 Nút thêm âm thanh */}
      <View style={styles.topButton}>
        <TouchableOpacity style={styles.soundBtn}>
          <Text style={styles.soundText}>Thêm âm thanh</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Nút điều khiển chụp ảnh */}
      <View style={styles.bottomControls}>
        {/* Chọn ảnh từ thư viện */}
        <TouchableOpacity>
          <Images size={38} color="#fff" />
        </TouchableOpacity>

        {/* Nút chụp */}
        <TouchableOpacity onPress={handleTakePicture} disabled={!isReady}>
          <View style={styles.captureBtn}>
            <Aperture size={64} color="#000" weight="fill" />
          </View>
        </TouchableOpacity>

        {/* Đổi camera */}
        <TouchableOpacity onPress={() => setFacing(facing === "back" ? "front" : "back")}>
          <MaterialCommunityIcons name="camera-switch-outline" size={38} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  topButton: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
  },
  soundBtn: {
    backgroundColor: "#d9d9d9",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soundText: { fontWeight: "bold", color: "#000" },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  captureBtn: {
    width: 45,
    height: 45,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
