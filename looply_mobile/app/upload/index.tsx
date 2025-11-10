import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

export default function UploadScreen() {
  const { uri } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const videoUri = Array.isArray(uri) ? uri[0] : uri ?? "";

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      {uri ? (
        <VideoView
          player={player}
          style={styles.preview}
          allowsPictureInPicture
        />
      ) : null}

      <Text style={styles.label}>Tiêu đề:</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tiêu đề..."
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Mô tả:</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Nhập mô tả..."
        value={desc}
        onChangeText={setDesc}
        multiline
      />

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.uploadBtn}>
          <Text style={styles.uploadText}>Đăng tải</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Hủy bỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  preview: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    backgroundColor: "#ccc",
    marginBottom: 20,
  },
  label: { fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  textarea: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    height: 100,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  buttons: { flexDirection: "row", justifyContent: "center" },
  uploadBtn: {
    backgroundColor: "#ff4d5a",
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  cancelBtn: {
    backgroundColor: "#d9d9d9",
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelText: { fontWeight: "bold", fontSize: 16 },
});
