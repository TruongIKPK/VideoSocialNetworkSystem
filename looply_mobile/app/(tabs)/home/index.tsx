import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

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
  onVideoProgress,
  onComment,
  currentUserId,
}: {
  item: VideoPost;
  index: number;
  isCurrent: boolean;
  onLike: (videoId: string) => void;
  onVideoProgress: (videoId: string, duration: number) => void;
  onComment: (videoId: string) => void;
  currentUserId: string | null;
}) => {
  const isLiked = currentUserId && item.likedBy && item.likedBy.includes(currentUserId);
  const likesCount = item.likes || item.likesCount || 0;
  const commentsCount = item.comments || item.commentsCount || 0;
  const sharesCount = item.shares || 0;
  const viewsCount = item.views || 0;

  const watchTimeRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

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
      // Bắt đầu đếm thời gian xem
      watchTimeRef.current = 0;
      intervalRef.current = setInterval(() => {
        watchTimeRef.current += 1;

        // Gửi thông tin sau mỗi 5 giây
        if (watchTimeRef.current % 5 === 0) {
          onVideoProgress(item._id, watchTimeRef.current);
        }
      }, 1000);
    } else {
      player.pause();

      // Dừng đếm và gửi thông tin cuối cùng
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        if (watchTimeRef.current > 0) {
          onVideoProgress(item._id, watchTimeRef.current);
        }
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
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
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradientOverlay}
        locations={[0, 1]}
      />

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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(item._id)}
        >
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
  const router = useRouter();
  const { userId } = useCurrentUser();
  const { isAuthenticated, token } = useUser();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const BATCH_SIZE = 3;

  useEffect(() => {
    fetchVideos();
  }, [isAuthenticated]);

  // Theo dõi khi xem đến video thứ 2 trong batch để load thêm
  useEffect(() => {
    if (isLoading || isLoadingMore) return;
    
    // Tính toán batch hiện tại
    const currentBatch = Math.floor(currentIndex / BATCH_SIZE);
    const positionInBatch = currentIndex % BATCH_SIZE;
    
    // Khi đang xem video thứ 2 trong batch (index 1 trong batch)
    if (positionInBatch === 1) {
      // Kiểm tra xem đã load batch tiếp theo chưa
      const nextBatchStart = (currentBatch + 1) * BATCH_SIZE;
      if (videos.length <= nextBatchStart) {
        fetchMoreVideos();
      }
    }
  }, [currentIndex, videos.length, isLoading, isLoadingMore]);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    // Reset loaded video IDs khi fetch lại từ đầu
    setLoadedVideoIds(new Set());
    try {
      let url: string;
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        // Nếu đã đăng nhập: dùng recommended API
        url = `${API_BASE_URL}/video-views/recommended?limit=${BATCH_SIZE}`;
        headers.Authorization = `Bearer ${token}`;
      } else {
        // Nếu chưa đăng nhập: dùng latest API
        url = `${API_BASE_URL}/videos/latest`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Recommended API trả về array trực tiếp, latest trả về {videos: [...]}
      const videoList = Array.isArray(data) ? data : (data.videos || data);

      if (Array.isArray(videoList) && videoList.length > 0) {
        // Deduplicate videos
        const uniqueVideos = videoList.filter(
          (video) => !loadedVideoIds.has(video._id)
        );

        if (uniqueVideos.length > 0) {
          // Update loaded video IDs
          const newVideoIds = new Set(loadedVideoIds);
          uniqueVideos.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          setVideos(uniqueVideos);
        } else {
          setError("No new videos available");
        }
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

  const fetchMoreVideos = async () => {
    if (isLoadingMore) return; // Tránh load nhiều lần

    setIsLoadingMore(true);
    try {
      let url: string;
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        // Nếu đã đăng nhập: tiếp tục dùng recommended API
        url = `${API_BASE_URL}/video-views/recommended?limit=${BATCH_SIZE}`;
        headers.Authorization = `Bearer ${token}`;
      } else {
        // Nếu chưa đăng nhập: dùng random API
        url = `${API_BASE_URL}/videos/random?limit=${BATCH_SIZE}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Recommended API trả về array trực tiếp, random trả về {videos: [...]}
      const videoList = Array.isArray(data) ? data : (data.videos || data);

      if (Array.isArray(videoList) && videoList.length > 0) {
        // Deduplicate trước khi thêm vào list
        const newVideos = videoList.filter(
          (video) => !loadedVideoIds.has(video._id)
        );

        if (newVideos.length > 0) {
          // Update loaded video IDs
          const newVideoIds = new Set(loadedVideoIds);
          newVideos.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          // Append vào danh sách hiện tại (không replace)
          setVideos((prev) => [...prev, ...newVideos]);
        }
      }
    } catch (error) {
      console.error("Fetch more videos error:", error);
      // Không hiển thị error cho user, chỉ log
    } finally {
      setIsLoadingMore(false);
    }
  };

  const recordVideoView = async (videoId: string, watchDuration: number) => {
    try {
      if (!isAuthenticated || !token) {
        // Nếu chưa đăng nhập, chỉ lưu local
        return;
      }

      // Kiểm tra đã gửi chưa để tránh spam
      if (viewedVideos.has(videoId)) {
        return;
      }

      const completed = watchDuration > 10; // Coi như xem hết nếu xem > 10s

      const response = await fetch(`${API_BASE_URL}/video-views/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          watchDuration,
          completed,
        }),
      });

      if (response.ok) {
        setViewedVideos((prev) => new Set(prev).add(videoId));
      }
    } catch (error) {
      console.error("Record video view error:", error);
    }
  };

  const handleVideoProgress = (videoId: string, duration: number) => {
    // Gửi thông tin xem video về server
    recordVideoView(videoId, duration);
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
    if (!userId || !isAuthenticated || !token) {
      return;
    }

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id === videoId) {
          const isCurrentlyLiked = video.likedBy.includes(userId);
          const currentLikes = video.likes || video.likesCount || 0;

          return {
            ...video,
            likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likedBy: isCurrentlyLiked
              ? video.likedBy.filter((id) => id !== userId)
              : [...video.likedBy, userId],
          };
        }
        return video;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error("Failed to like video");
      }
    } catch (error) {
      console.error("Like error:", error);
      // Revert on error
      if (userId) {
        setVideos((prev) =>
          prev.map((video) => {
            if (video._id === videoId) {
              const isCurrentlyLiked = video.likedBy.includes(userId);
              const currentLikes = video.likes || video.likesCount || 0;

              return {
                ...video,
                likes: isCurrentlyLiked ? currentLikes + 1 : currentLikes - 1,
                likesCount: isCurrentlyLiked ? currentLikes + 1 : currentLikes - 1,
                likedBy: isCurrentlyLiked
                  ? [...video.likedBy, userId]
                  : video.likedBy.filter((id) => id !== userId),
              };
            }
            return video;
          })
        );
      }
    }
  };

  const handleComment = (videoId: string) => {
    router.push({
      pathname: "/(tabs)/home/comments",
      params: { videoId },
    });
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
        onVideoProgress={handleVideoProgress}
        onComment={handleComment}
        currentUserId={userId}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <Loading message="Loading videos..." color={Colors.primary} fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchVideos}
          variant="primary"
          style={{ marginTop: Spacing.lg }}
        />
      </SafeAreaView>
    );
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more videos...</Text>
      </View>
    );
  };

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
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    textAlign: "center",
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
    backgroundColor: Colors.black,
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
  },
  userInfo: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 80,
    padding: Spacing.md,
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
    borderRadius: BorderRadius.avatar,
    borderWidth: 2,
    borderColor: Colors.white,
    marginRight: Spacing.md,
    backgroundColor: Colors.gray[700],
  },
  userText: {
    flex: 1,
  },
  username: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hashtags: {
    color: Colors.accent,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
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
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.md,
  },
  followButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  actionButtons: {
    position: "absolute",
    right: Spacing.md,
    bottom: 120,
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingMoreContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.black,
  },
  loadingMoreText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
