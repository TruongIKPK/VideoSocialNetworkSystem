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
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoPost {
  _id: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://videosocialnetworksystem.onrender.com/api/videos/feed"
      );
      const data = await response.json();

      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Fetch videos error:", error);
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
            video.playAsync();
          } else {
            video.pauseAsync();
          }
        }
      });
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleLike = async (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video._id === videoId
          ? {
              ...video,
              isLiked: !video.isLiked,
              likes: video.isLiked ? video.likes - 1 : video.likes + 1,
            }
          : video
      )
    );

    // TODO: Call API to like/unlike
  };

  const handleSave = async (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video._id === videoId ? { ...video, isSaved: !video.isSaved } : video
      )
    );

    // TODO: Call API to save/unsave
  };

  const renderVideoItem = ({
    item,
    index,
  }: {
    item: VideoPost;
    index: number;
  }) => (
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
      />

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userInfoLeft}>
          <Image
            source={{
              uri: item.author.avatar || "https://via.placeholder.com/40",
            }}
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
            name={item.isLiked ? "heart" : "heart-outline"}
            size={32}
            color={item.isLiked ? "#FF3B30" : "#FFF"}
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSave(item._id)}
        >
          <Ionicons
            name={item.isSaved ? "bookmark" : "bookmark-outline"}
            size={30}
            color="#FFF"
          />
          <Text style={styles.actionText}>Save</Text>
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
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
  },
  userText: {
    flex: 1,
  },
  username: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
