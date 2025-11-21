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
  const lastFetchedIndexRef = useRef(-1); // Track index đã fetch để tránh fetch nhiều lần
  const lastVideosLengthRef = useRef(0); // Track số lượng video để phát hiện khi có video mới

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

  // Video actions (like, comment, follow, save)
  const { handleLike, handleComment, handleFollow, handleSave } = useVideoActions({
    videos,
    setVideos,
    userId,
    isAuthenticated,
    token,
  });

  // Video view tracking
  const { handleVideoProgress, recordVideoStart } = useVideoView({
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

<<<<<<< HEAD
  // Animation cho loading icon
  useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(loadingIconScale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(loadingIconScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading]);

  useEffect(() => {
    fetchVideos();
  }, [isAuthenticated]);

  // Fetch video cụ thể theo ID (khi video không có trong list hiện tại)
  const fetchSpecificVideo = async (videoId: string) => {
    try {
      console.log(`[Home] 🔍 Fetching specific video: ${videoId}`);
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}`);
      
      if (response.ok) {
        const videoData = await response.json();
        console.log(`[Home] ✅ Fetched video:`, videoData._id);
        
        // Kiểm tra xem video đã có trong list chưa
        const existingIndex = videos.findIndex(v => v._id === videoData._id);
        if (existingIndex === -1) {
          // Thêm video vào đầu list
          setVideos(prev => [videoData, ...prev]);
          console.log(`[Home] ✅ Added video to list, scrolling to index 0`);
          
          // Scroll đến video mới thêm
          setTimeout(() => {
            if (flatListRef.current) {
              try {
                flatListRef.current.scrollToIndex({
                  index: 0,
                  animated: true,
                  viewPosition: 0,
                });
                setCurrentIndex(0);
                hasScrolledToVideoRef.current = true;
              } catch (error) {
                console.log(`[Home] ⚠️ Error scrolling to new video:`, error);
                // Fallback: scroll to offset
                flatListRef.current.scrollToOffset({
                  offset: 0,
                  animated: true,
                });
                setCurrentIndex(0);
              }
            }
          }, 500);
        } else {
          // Video đã có, scroll đến nó
          console.log(`[Home] ✅ Video already in list at index ${existingIndex}, scrolling...`);
          setTimeout(() => {
            if (flatListRef.current) {
              try {
                flatListRef.current.scrollToIndex({
                  index: existingIndex,
                  animated: true,
                  viewPosition: 0,
                });
                setCurrentIndex(existingIndex);
                hasScrolledToVideoRef.current = true;
              } catch (error) {
                console.log(`[Home] ⚠️ Error scrolling to existing video:`, error);
                // Fallback: scroll to offset
                const offset = existingIndex * SCREEN_HEIGHT;
                flatListRef.current?.scrollToOffset({
                  offset,
                  animated: true,
                });
                setCurrentIndex(existingIndex);
              }
            }
          }, 500);
        }
      } else {
        console.warn(`[Home] ⚠️ Failed to fetch video ${videoId}:`, response.status);
      }
    } catch (error) {
      console.error(`[Home] ❌ Error fetching specific video:`, error);
    }
  };

=======
>>>>>>> df4026aa05bbbe506caa98460e56412567405776
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
<<<<<<< HEAD
        console.log(`[Home] ⚠️ Video ${videoId} not found in current videos list`);
        console.log(`[Home] 📋 Current videos count: ${videos.length}`);
        console.log(`[Home] 🔍 Available video IDs:`, videos.slice(0, 5).map(v => v._id));
        
        // Nếu video không có trong danh sách, thử fetch video đó
        fetchSpecificVideo(videoId);
=======
        console.log(`[Home] ⚠️ Video ${videoId} not found in current videos list, will try to fetch it`);
>>>>>>> df4026aa05bbbe506caa98460e56412567405776
      }
    }
  }, [params.videoId, params.scrollToVideo, videos, scrollToIndex]);

  // Reset tracking khi có video mới được load hoặc videos list bị trim
  useEffect(() => {
    // Đảm bảo currentIndex luôn trong bounds khi videos list thay đổi
    if (videos.length > 0 && currentIndex >= videos.length) {
      const validIndex = Math.max(0, videos.length - 1);
      setCurrentIndex(validIndex);
      console.log(`[Home] ⚠️ Adjusted currentIndex from ${currentIndex} to ${validIndex} (videos.length: ${videos.length})`);
    }
    
    if (videos.length > lastVideosLengthRef.current) {
      // Có video mới được thêm vào
      // Reset lastFetchedIndex để cho phép fetch tiếp theo khi cần
      if (videos.length - lastVideosLengthRef.current >= BATCH_SIZE) {
        // Nếu có nhiều video mới (>= BATCH_SIZE), reset tracking
        lastFetchedIndexRef.current = Math.max(-1, currentIndex - 1);
      }
      lastVideosLengthRef.current = videos.length;
    } else if (videos.length < lastVideosLengthRef.current) {
      // Videos list bị trim (giảm số lượng) - có thể do memory management
      console.log(`[Home] ⚠️ Videos list trimmed from ${lastVideosLengthRef.current} to ${videos.length}`);
      // Điều chỉnh currentIndex nếu cần
      if (currentIndex >= videos.length) {
        const validIndex = Math.max(0, videos.length - 1);
        setCurrentIndex(validIndex);
      }
      lastVideosLengthRef.current = videos.length;
      // Reset fetch tracking để có thể fetch lại nếu cần
      lastFetchedIndexRef.current = Math.max(-1, currentIndex - 3);
    }
  }, [videos.length, currentIndex, BATCH_SIZE, setCurrentIndex]);

  // Theo dõi khi gần hết video để load thêm
  useEffect(() => {
    if (isLoading || isLoadingMore || videos.length === 0) return;

    const remainingVideos = videos.length - currentIndex - 1;
    
    // Fetch khi còn 3 video hoặc ít hơn để đảm bảo có video mới trước khi hết
    const shouldFetch = remainingVideos >= 0 && remainingVideos <= 3;
    
    // Chỉ fetch nếu:
    // 1. Điều kiện trigger đúng (còn 0-3 video)
    // 2. Chưa fetch ở index này hoặc index gần đây (để tránh fetch nhiều lần)
    // 3. Không đang fetch
    const hasFetchedRecently = lastFetchedIndexRef.current >= currentIndex - 1;
    
    if (shouldFetch && !hasFetchedRecently) {
      console.log(`[Home] 📥 Loading more videos. Current index: ${currentIndex}, Total videos: ${videos.length}, Remaining: ${remainingVideos}`);
      lastFetchedIndexRef.current = currentIndex;
      
      // Gọi fetchMoreVideos ngay lập tức để có video mới sớm
      fetchMoreVideos().then((hasNewVideos) => {
        if (!hasNewVideos) {
          console.log(`[Home] ⚠️ No new videos found. Will retry later.`);
          // Reset lastFetchedIndex để có thể thử lại sau khi scroll thêm
          lastFetchedIndexRef.current = Math.max(-1, currentIndex - 3);
        } else {
          console.log(`[Home] ✅ Successfully loaded new videos`);
        }
      });
    }
  }, [currentIndex, videos.length, isLoading, isLoadingMore, fetchMoreVideos]);

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
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onLike={handleLike}
        onVideoProgress={handleVideoProgress}
        onVideoStart={recordVideoStart}
        onComment={handleComment}
        onFollow={handleFollow}
        onSave={handleSave}
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
