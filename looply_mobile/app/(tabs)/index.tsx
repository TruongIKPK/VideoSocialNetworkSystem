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
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface Author {
  _id: string;
  name: string;
  username: string;
  avatar: string;
}

interface VideoPost {
  _id: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description?: string;
  author: Author;
  likes: number;
  likesList: string[];
  comments: number;
  shares: number;
  views: number;
  hashtags?: string[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface APIResponse {
  videos: VideoPost[];
  total: number;
  page: number;
  limit: number;
}

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});

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

      const data: APIResponse = await response.json();

      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
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

      // Pause all videos except the current one
      Object.keys(videoRefs.current).forEach((key) => {
        const video = videoRefs.current[key];
        if (video) {
          if (parseInt(key) === visibleIndex) {
            video.playAsync().catch((err) => console.log("Play error:", err));
          } else {
            video.pauseAsync().catch((err) => console.log("Pause error:", err));
          }
        }
      });
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const getAvatarUri = (avatar: string) => {
    if (!avatar) {
      return require("@/assets/images/no_avatar.png");
    }
    if (avatar.startsWith("http")) {
      return { uri: avatar };
    }
    if (avatar === "/no_avatar.png") {
      return require("@/assets/images/no_avatar.png");
    }
    return { uri: `https://videosocialnetworksystem.onrender.com${avatar}` };
  };

  const handleLike = async (videoId: string) => {
    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) =>
        video._id === videoId
          ? {
              ...video,
              likes: video.likesList.includes("currentUserId")
                ? video.likes - 1
                : video.likes + 1,
              likesList: video.likesList.includes("currentUserId")
                ? video.likesList.filter((id) => id !== "currentUserId")
                : [...video.likesList, "currentUserId"],
            }
          : video
      )
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
        prev.map((video) =>
          video._id === videoId
            ? {
                ...video,
                likes: video.likesList.includes("currentUserId")
                  ? video.likes + 1
                  : video.likes - 1,
                likesList: video.likesList.includes("currentUserId")
                  ? [...video.likesList, "currentUserId"]
                  : video.likesList.filter((id) => id !== "currentUserId"),
              }
            : video
        )
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
    const isLiked = item.likesList && item.likesList.includes("currentUserId");

    return (
      <View style={styles.videoContainer}>
        {/* Video Player */}
        <Video
          ref={(ref) => {
            if (ref) {
              videoRefs.current[index.toString()] = ref;
            }
          }}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={index === currentIndex}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              // Video finished, replay
              videoRefs.current[index.toString()]?.replayAsync();
            }
          }}
        />

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userInfoLeft}>
            <Image
              source={getAvatarUri(item.author.avatar)}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <Text style={styles.username}>@{item.author.username}</Text>
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
              <View style={styles.videoStats}>
                <Ionicons name="eye-outline" size={14} color="#FFF" />
                <Text style={styles.statsText}>
                  {item.views?.toLocaleString() || 0}
                </Text>
              </View>
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
            onPress={() => handleLike(item._id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#FF3B30" : "#FFF"}
            />
            <Text style={styles.actionText}>
              {item.likes?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
            <Text style={styles.actionText}>
              {item.comments?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={30} color="#FFF" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={30} color="#FFF" />
            <Text style={styles.actionText}>
              {item.shares?.toLocaleString() || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
