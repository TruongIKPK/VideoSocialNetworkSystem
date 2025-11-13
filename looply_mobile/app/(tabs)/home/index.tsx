import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const videoData = [
  {
    id: "1",
    videoUrl:
      "https://res.cloudinary.com/dcnmynqty/video/upload/videos/vnjldnkahpmji1fywijl.mp4",
    username: "@Abd_Hakim_Zayd ✓",
    description: "living 🐱",
    soundInfo: "🎵 Original sound",
    likes: "94.6M",
    comments: "320K",
    shares: "81.7K",
    saves: "59M",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
  },
  {
    id: "2",
    videoUrl:
      "https://res.cloudinary.com/dcnmynqty/video/upload/videos/cymmx9xquwcboi0gryfa.mp4",
    username: "@user2 ✓",
    description: "Amazing content!",
    soundInfo: "🎵 Trending sound",
    likes: "2.1M",
    comments: "15K",
    shares: "8.2K",
    saves: "12M",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786",
  },
];

// 👉 Component con dùng để render mỗi video
const VideoItem = ({
  item,
  index,
  isCurrent,
}: {
  item: any;
  index: number;
  isCurrent: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(isCurrent);
  const [isLike, setIsLike] = useState(false);
  const [isSave, setIsSave] = useState(false);

  // ✅ useVideoPlayer phải ở đây (mỗi video là một component)
  const player = useVideoPlayer(item.videoUrl, (player) => {
    player.loop = true;
    if (isCurrent) player.play();
    else player.pause();
  });

  // Khi video hiện ra -> play; khi rời -> pause
  useEffect(() => {
    if (isCurrent) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isCurrent]);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.backgroundVideo}
        allowsFullscreen
        allowsPictureInPicture
      />

      <TouchableOpacity
        style={styles.videoOverlay}
        onPress={togglePlay}
        activeOpacity={1}
      />

      {/* Biểu tượng Play khi pause */}
      {!isPlaying && isCurrent && (
        <View style={styles.playPauseIndicator}>
          <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* Nút bên phải */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.followButton}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsLike(!isLike)}
        >
          <Ionicons
            name="heart"
            size={32}
            color={isLike ? "red" : "#fff"}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={28} color="#fff" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo" size={28} color="#fff" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsSave(!isSave)}
        >
          <Ionicons
            name="bookmark"
            size={28}
            color={isSave ? "yellow" : "#fff"}
          />
          <Text style={styles.actionText}>{item.saves}</Text>
        </TouchableOpacity>
      </View>

      {/* Thông tin người đăng */}
      <View style={styles.bottomSection}>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomContent}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.soundInfo}>{item.soundInfo}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

// 👉 Màn hình chính
export default function HomeScreen() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => setCurrentVideoIndex(0);
    }, [])
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setCurrentVideoIndex(viewableItems[0].index);
      }
    }
  ).current;

  return (
    <View style={styles.container}>
      <FlatList
        data={videoData}
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            index={index}
            isCurrent={index === currentVideoIndex}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoContainer: { width, height, position: "relative" },
  backgroundVideo: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rightActions: {
    position: "absolute",
    right: 15,
    top: height * 0.3,
    alignItems: "center",
  },
  actionButton: { alignItems: "center", marginVertical: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
  },
  followButton: {
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -12,
  },
  plusIcon: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  actionText: { color: "#fff", fontSize: 12, marginTop: 5, fontWeight: "600" },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradient: { flex: 1, padding: 10 },
  bottomContent: {
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  username: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  description: { color: "#fff", fontSize: 14, marginTop: 4 },
  soundInfo: { color: "#fff", fontSize: 13, opacity: 0.8, marginTop: 4 },
  playPauseIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
});
