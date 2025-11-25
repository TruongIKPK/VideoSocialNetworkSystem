import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useRouter, useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
import { useHomeReload } from "@/contexts/HomeReloadContext";
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
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { userId } = useCurrentUser();
  const { isAuthenticated, token } = useUser();
  const { isReloading, setIsReloading, setReloadCallback } = useHomeReload();
  const Colors = useColors(); // Get theme-aware colors
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const hasScrolledToVideoRef = useRef(false);
  const lastFetchedIndexRef = useRef(-1); // Track index đã fetch để tránh fetch nhiều lần
  const lastVideosLengthRef = useRef(0); // Track số lượng video để phát hiện khi có video mới
  const lastFocusTimeRef = useRef<number>(0); // Track thời gian focus lần trước
  const focusCountRef = useRef(0); // Track số lần focus
  const isManualReloadRef = useRef(false); // Track xem có phải reload thủ công không
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

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
  const { handleLike, handleComment, handleFollow, handleSave, handleShare } = useVideoActions({
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

  // Lưu fetchVideos vào ref để tránh stale closure trong useFocusEffect
  const fetchVideosRef = useRef(fetchVideos);
  fetchVideosRef.current = fetchVideos;

  // Cập nhật reload state khi isLoading thay đổi
  useEffect(() => {
    console.log(`[Home] 🔄 isLoading changed: ${isLoading}, isManualReload: ${isManualReloadRef.current}`);
    if (isManualReloadRef.current) {
      // Nếu là reload thủ công, chỉ reset khi loading xong
      if (!isLoading) {
        console.log(`[Home] ✅ Loading finished, resetting isReloading`);
        isManualReloadRef.current = false;
        // Reset ngay lập tức để animation dừng nhanh
        setIsReloading(false);
      } else {
        console.log(`[Home] ⏳ Still loading...`);
      }
    }
  }, [isLoading, setIsReloading]);
  
  // Safety timeout: Đảm bảo isReloading không quay mãi mãi (tối đa 10 giây)
  useEffect(() => {
    if (isReloading) {
      const safetyTimeout = setTimeout(() => {
        console.log(`[Home] ⚠️ Safety timeout: Force reset isReloading after 10s`);
        isManualReloadRef.current = false;
        setIsReloading(false);
      }, 10000); // 10 giây
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isReloading, setIsReloading]);

  // Xử lý khi tab được focus/unfocus - CHỈ để track focus state, KHÔNG reload
  useFocusEffect(
    React.useCallback(() => {
      console.log(`[Home] 📍 useFocusEffect triggered - chỉ track focus, không reload`);
      setIsScreenFocused(true);
      
      return () => {
        console.log(`[Home] 🔚 useFocusEffect cleanup`);
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Đăng ký reload callback với context - CHỈ được gọi khi nhấn icon home ở tab bar
  // KHÔNG có logic reload tự động nào khác (không reload khi focus, không reload tự động)
  useEffect(() => {
    const reloadHandler = () => {
      console.log(`[Home] 🔄 Manual reload triggered from icon home press ONLY`);
      
      // Kiểm tra xem có đang loading không để tránh reload nhiều lần
      if (isLoading) {
        console.log(`[Home] ⚠️ Already loading, skipping reload`);
        return;
      }
      
      // Kiểm tra xem có đang reload không
      if (isManualReloadRef.current) {
        console.log(`[Home] ⚠️ Already in manual reload, skipping`);
        return;
      }
      
      console.log(`[Home] ✅ Starting manual reload from icon home ONLY`);
      isManualReloadRef.current = true;
      setIsReloading(true);
      // Scroll về đầu danh sách ngay lập tức (không delay)
      if (flatListRef.current && videos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: false });
      }
      // Gọi fetchVideos với isManualReload = true để không filter duplicates
      fetchVideosRef.current(true);
    };
    
    console.log(`[Home] 📝 Registering reload callback - CHỈ cho icon home press, KHÔNG tự động`);
    setReloadCallback(reloadHandler);
    return () => {
      console.log(`[Home] 🗑️ Unregistering reload callback`);
      setReloadCallback(() => {});
    };
  }, [setReloadCallback, setIsReloading, isLoading, videos.length]);

  // Fetch video cụ thể theo ID (khi video không có trong list hiện tại)
  const fetchSpecificVideo = async (videoId: string) => {
    try {
      const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
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
            scrollToIndex(0, true);
            hasScrolledToVideoRef.current = true;
          }, 500);
        } else {
          // Video đã có, scroll đến nó
          console.log(`[Home] ✅ Video already in list at index ${existingIndex}, scrolling...`);
          setTimeout(() => {
            scrollToIndex(existingIndex, true);
            hasScrolledToVideoRef.current = true;
          }, 500);
        }
      } else {
        console.warn(`[Home] ⚠️ Failed to fetch video ${videoId}:`, response.status);
      }
    } catch (error) {
      console.error(`[Home] ❌ Error fetching specific video:`, error);
    }
  };
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
        console.log(`[Home] ⚠️ Video ${videoId} not found in current videos list`);
        console.log(`[Home] 📋 Current videos count: ${videos.length}`);
        console.log(`[Home] 🔍 Available video IDs:`, videos.slice(0, 5).map(v => v._id));
        
        // Nếu video không có trong danh sách, thử fetch video đó
        fetchSpecificVideo(videoId);
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
        onShare={handleShare}
        currentUserId={userId}
        isScreenFocused={isScreenFocused}
        isLoadingMore={isLoadingMore}
      />
    </SafeAreaView>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
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
};
