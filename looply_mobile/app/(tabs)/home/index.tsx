import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface User {
  _id: string;
  name: string;
  avatar: string;
}

interface VideoPost {
  _id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  user: User;
  likes?: number;
  likesCount?: number;
  likedBy: string[];
  comments?: number;
  commentsCount?: number;
  shares?: number;
  saves?: number;
  views?: number;
  viewedBy?: string[];
  savedBy?: string[];
  hashtags?: string[];
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

// Component riêng cho mỗi video item
const VideoItem = ({
  item,
  index,
  isCurrent,
  onLike,
}: {
  item: VideoPost;
  index: number;
  isCurrent: boolean;
  onLike: (videoId: string) => void;
}) => {
  const isLiked = item.likedBy && item.likedBy.includes("currentUserId");
  const likesCount = item.likes || item.likesCount || 0;
  const commentsCount = item.comments || item.commentsCount || 0;
  const sharesCount = item.shares || 0;
  const viewsCount = item.views || 0;

  const player = useVideoPlayer(item.url, (player) => {
    player.loop = true;
    if (isCurrent) {
      player.play();
    } else {
      player.pause();
    }
  });

  useEffect(() => {
    if (isCurrent) {
      player.play();
    } else {
      player.pause();
    }
  }, [isCurrent, player]);

  return (
    <View style={styles.videoContainer}>
      {/* Video Player */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        allowsPictureInPicture={false}
      />

      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userInfoLeft}>
          <Image
            source={getAvatarUri(item.user.avatar)}
            style={styles.avatar}
          />
          <View style={styles.userText}>
            <Text style={styles.username}>{item.user.name}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.hashtags && item.hashtags.length > 0 ? (
              <Text style={styles.hashtags} numberOfLines={1}>
                {item.hashtags.map((tag) => `#${tag}`).join(" ")}
              </Text>
            ) : null}
            {viewsCount > 0 ? (
              <View style={styles.videoStats}>
                <Ionicons name="eye-outline" size={14} color="#FFF" />
                <Text style={styles.statsText}>{formatNumber(viewsCount)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Like */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(item._id)}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={32}
            color={isLiked ? "#FF3B30" : "#FFF"}
          />
          <Text style={styles.actionText}>{formatNumber(likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
          <Text style={styles.actionText}>{formatNumber(commentsCount)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={30} color="#FFF" />
          <Text style={styles.actionText}>{formatNumber(sharesCount)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://videosocialnetworksystem.onrender.com/api/videos"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // API trả về mảng video trực tiếp, không phải object với property videos
      if (Array.isArray(data) && data.length > 0) {
        setVideos(data);
      } else {
        setError("No videos available");
      }
    } catch (error) {
      console.error("Fetch videos error:", error);
      setError("Failed to load videos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setCurrentIndex(visibleIndex);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleLike = async (videoId: string) => {
    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id === videoId) {
          const isCurrentlyLiked = video.likedBy.includes("currentUserId");
          const currentLikes = video.likes || video.likesCount || 0;
          
          return {
            ...video,
            likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likedBy: isCurrentlyLiked
              ? video.likedBy.filter((id) => id !== "currentUserId")
              : [...video.likedBy, "currentUserId"],
          };
        }
        return video;
      })
    );

    try {
      // TODO: Call API to like/unlike
      // const response = await fetch(`API_URL/videos/${videoId}/like`, {
      //   method: 'POST',
      //   headers: { 'Authorization': 'Bearer TOKEN' }
      // });
    } catch (error) {
      console.error("Like error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((video) => {
          if (video._id === videoId) {
            const isCurrentlyLiked = video.likedBy.includes("currentUserId");
            const currentLikes = video.likes || video.likesCount || 0;
            
            return {
              ...video,
              likes: isCurrentlyLiked ? currentLikes + 1 : currentLikes - 1,
              likesCount: isCurrentlyLiked ? currentLikes + 1 : currentLikes - 1,
              likedBy: isCurrentlyLiked
                ? [...video.likedBy, "currentUserId"]
                : video.likedBy.filter((id) => id !== "currentUserId"),
            };
          }
          return video;
        })
      );
    }
  };

  const renderVideoItem = ({
    item,
    index,
  }: {
    item: VideoPost;
    index: number;
  }) => {
    return (
      <VideoItem
        item={item}
        index={index}
        isCurrent={index === currentIndex}
        onLike={handleLike}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVideos}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
  },
  userInfo: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 80,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  userInfoLeft: {
    flexDirection: "row",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFF",
    marginRight: 12,
    backgroundColor: "#333",
  },
  userText: {
    flex: 1,
  },
  username: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: "#FFF",
    fontSize: 13,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hashtags: {
    color: "#00D4FF",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginLeft: 12,
  },
  followButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    position: "absolute",
    right: 12,
    bottom: 120,
    gap: 24,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
