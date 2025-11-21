import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Colors, Spacing } from "@/constants/theme";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { VideoItem } from "@/components/home/VideoItem";
import { LoadingScreen } from "@/components/home/LoadingScreen";
import { ErrorScreen } from "@/components/home/ErrorScreen";
import { VideoList } from "@/components/home/VideoList";
import { useVideoList } from "@/hooks/useVideoList";
import { useVideoActions } from "@/hooks/useVideoActions";
import { useVideoScroll } from "@/hooks/useVideoScroll";
import { useVideoView } from "@/hooks/useVideoView";
import { VideoPost } from "@/types/video";
import { Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useCurrentUser();
  const { isAuthenticated, token } = useUser();
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const hasScrolledToVideoRef = useRef(false);

  // Video list management
  const {
    videos,
    setVideos,
    isLoading,
    isLoadingMore,
    error,
    fetchVideos,
    fetchMoreVideos,
    BATCH_SIZE,
  } = useVideoList({
    isAuthenticated,
    token,
    userId,
  });

  // Video actions (like, comment, follow)
  const { handleLike, handleComment, handleFollow } = useVideoActions({
    videos,
    setVideos,
    userId,
    isAuthenticated,
    token,
  });

  // Video view tracking
  const { handleVideoProgress } = useVideoView({
    isAuthenticated,
    token,
  });

  // Scroll management
  const {
    flatListRef,
    currentIndex,
    setCurrentIndex,
    onViewableItemsChanged,
    viewabilityConfig,
    snapToOffsets,
    handleScrollBeginDrag,
    handleScroll,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    scrollToIndex,
  } = useVideoScroll({
    videos,
    onIndexChange: (index) => {
      // Handle index change if needed
    },
  });

  // Xử lý khi tab được focus/unfocus
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Xử lý scroll đến video khi có videoId từ params
  useEffect(() => {
    const videoId = params.videoId as string | undefined;
    const shouldScroll = params.scrollToVideo === "true";

    if (videoId && shouldScroll && videos.length > 0 && !hasScrolledToVideoRef.current) {
      const videoIndex = videos.findIndex((v) => v._id === videoId);

      if (videoIndex !== -1) {
        console.log(`[Home] 🎬 Scrolling to video: ${videoId} at index: ${videoIndex}`);
        hasScrolledToVideoRef.current = true;

        setTimeout(() => {
          scrollToIndex(videoIndex, true);
        }, 500);
      } else if (videoIndex === -1) {
        console.log(`[Home] ⚠️ Video ${videoId} not found in current videos list, will try to fetch it`);
      }
    }
  }, [params.videoId, params.scrollToVideo, videos, scrollToIndex]);

  // Theo dõi khi xem đến video thứ 2 trong batch để load thêm
  useEffect(() => {
    if (isLoading || isLoadingMore) return;

    const currentBatch = Math.floor(currentIndex / BATCH_SIZE);
    const positionInBatch = currentIndex % BATCH_SIZE;

    if (positionInBatch === 1) {
      const nextBatchStart = (currentBatch + 1) * BATCH_SIZE;
      if (videos.length <= nextBatchStart) {
        fetchMoreVideos();
      }
    }
  }, [currentIndex, videos.length, isLoading, isLoadingMore, BATCH_SIZE, fetchMoreVideos]);

  const handleSearchIconPress = () => {
    console.log(`[Home] 🔍 Search icon pressed, navigating to search screen`);
    router.push({
      pathname: "/search",
      params: {},
    } as any);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={fetchVideos} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearchIconPress}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={24} color="#FFF" />
      </TouchableOpacity>

      <VideoList
        videos={videos}
        currentIndex={currentIndex}
        flatListRef={flatListRef}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToOffsets={snapToOffsets}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onLike={handleLike}
        onVideoProgress={handleVideoProgress}
        onComment={handleComment}
        onFollow={handleFollow}
        currentUserId={userId}
        isScreenFocused={isScreenFocused}
        isLoadingMore={isLoadingMore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  searchButton: {
    position: "absolute",
    top: 50,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
