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
  Pressable,
  Animated,
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

// Responsive values
const AVATAR_SIZE = Math.min(52, SCREEN_WIDTH * 0.13);
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const USER_INFO_BOTTOM = Math.max(100, SCREEN_HEIGHT * 0.12);
const USER_INFO_RIGHT = Math.max(90, SCREEN_WIDTH * 0.22);
const USER_INFO_MAX_WIDTH = SCREEN_WIDTH * 0.78;
const FOLLOW_BUTTON_MIN_WIDTH = Math.max(70, SCREEN_WIDTH * 0.18);

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
  isFollowing?: boolean; // Track follow status
}

// Component riêng cho mỗi video item
const VideoItem = ({
  item,
  index,
  isCurrent,
  onLike,
  onVideoProgress,
  onComment,
  onFollow,
  currentUserId,
  isScreenFocused,
}: {
  item: VideoPost;
  index: number;
  isCurrent: boolean;
  onLike: (videoId: string) => void;
  onVideoProgress: (videoId: string, duration: number) => void;
  onComment: (videoId: string) => void;
  onFollow: (userId: string) => void;
  currentUserId: string | null;
  isScreenFocused: boolean;
}) => {
  // Kiểm tra xem video đã được like chưa
  // Đảm bảo likedBy là array và có currentUserId
  const isLiked = 
    currentUserId && 
    item.likedBy && 
    Array.isArray(item.likedBy) && 
    item.likedBy.includes(currentUserId);
  const likesCount = item.likes || item.likesCount || 0;
  const commentsCount = item.comments || item.commentsCount || 0;
  const sharesCount = item.shares || 0;
  const viewsCount = item.views || 0;

  const watchTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  
  // Kiểm tra xem description có dài không (ước tính > 100 ký tự hoặc > 2 dòng)
  const isDescriptionLong = item.description && item.description.length > 100;

  const player = useVideoPlayer(item.url, (player) => {
    player.loop = true;
    if (isCurrent && !isPaused) {
      player.play();
    } else {
      player.pause();
    }
  });

  useEffect(() => {
    // Chỉ phát video nếu: là video hiện tại, không bị pause bởi user, và screen đang được focus
    if (isCurrent && !isPaused && isScreenFocused) {
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
  }, [isCurrent, player, isPaused, isScreenFocused]);

  // Reset pause state khi video không còn current
  useEffect(() => {
    if (!isCurrent) {
      setIsPaused(false);
      setIsDescriptionExpanded(false); // Reset expanded state khi chuyển video
    }
  }, [isCurrent]);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  // Xử lý tap để pause/play
  const handleTap = () => {
    if (!isCurrent) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms để phát hiện double tap

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - Like video
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      handleDoubleTap();
      lastTapRef.current = 0; // Reset để tránh trigger lại
    } else {
      // Single tap - Pause/Play
      lastTapRef.current = now;
      doubleTapTimeoutRef.current = setTimeout(() => {
        handleSingleTap();
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleSingleTap = () => {
    if (!isCurrent) return;
    setIsPaused((prev) => !prev);
  };

  const handleDoubleTap = () => {
    if (!isCurrent) return;
    // Trigger like
    onLike(item._id);
    
    // Animation heart
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 0,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.videoContainer}>
      {/* Video Player với Pressable để xử lý tap */}
      <Pressable 
        style={styles.videoPressable}
        onPress={handleTap}
        android_ripple={null}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          allowsPictureInPicture={false}
          nativeControls={false} // Tắt controls mặc định
        />
        
        {/* Pause indicator */}
        {isPaused && isCurrent && (
          <View style={styles.pauseOverlay}>
            <Ionicons name="pause" size={64} color="#FFF" />
          </View>
        )}

        {/* Double tap heart animation */}
        <Animated.View
          style={[
            styles.heartAnimation,
            {
              transform: [{ scale: heartScale }],
              opacity: heartScale.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name="heart"
            size={80}
            color="#FF3B30"
            style={styles.heartIcon}
          />
        </Animated.View>
      </Pressable>

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
            <View style={styles.userHeader}>
              <Text style={styles.username} numberOfLines={1}>
                {item.user.name}
              </Text>
              {viewsCount > 0 && (
                <View style={styles.videoStats}>
                  <Ionicons name="eye-outline" size={12} color="#FFF" />
                  <Text style={styles.statsText}>{formatNumber(viewsCount)}</Text>
                </View>
              )}
            </View>
            {item.title ? (
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            ) : null}
            {item.description ? (
              <View style={styles.descriptionContainer}>
                <Text 
                  style={styles.description} 
                  numberOfLines={isDescriptionExpanded ? undefined : 2}
                >
                  {item.description}
                </Text>
                {isDescriptionLong && (
                  <TouchableOpacity
                    onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButton}>
                      {isDescriptionExpanded ? "Thu gọn" : "Xem thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
            {item.hashtags && item.hashtags.length > 0 ? (
              <Text style={styles.hashtags} numberOfLines={1}>
                {item.hashtags.map((tag) => `#${tag}`).join(" ")}
              </Text>
            ) : null}
          </View>
        </View>
        {currentUserId && item.user._id !== currentUserId && (
          <TouchableOpacity 
            style={[
              styles.followButton,
              item.isFollowing && styles.followButtonFollowing
            ]}
            activeOpacity={0.7}
            onPress={() => onFollow(item.user._id)}
          >
            <Text style={[
              styles.followButtonText,
              item.isFollowing && styles.followButtonTextFollowing
            ]}>
              {item.isFollowing ? "Đang follow" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
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
  const params = useLocalSearchParams();
  const { userId } = useCurrentUser();
  const { isAuthenticated, token } = useUser();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string>>(new Set());
  const [isScreenFocused, setIsScreenFocused] = useState(true); // Track khi tab được focus
  const flatListRef = useRef<FlatList>(null);
  const scrollStartIndexRef = useRef<number>(0); // Lưu index khi bắt đầu scroll
  const isScrollingRef = useRef<boolean>(false); // Theo dõi trạng thái scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout để debounce scroll
  const lastSnappedIndexRef = useRef<number>(-1); // Track index đã snap để tránh snap lặp lại
  const loadingIconScale = useRef(new Animated.Value(1)).current;
  const BATCH_SIZE = 3;
  const hasScrolledToVideoRef = useRef(false); // Flag để tránh scroll nhiều lần

  // Xử lý khi tab được focus/unfocus
  useFocusEffect(
    React.useCallback(() => {
      // Tab được focus - phát video hiện tại
      setIsScreenFocused(true);
      
      return () => {
        // Tab mất focus - tạm dừng tất cả videos
        setIsScreenFocused(false);
      };
    }, [])
  );

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

  // Xử lý scroll đến video khi có videoId từ params
  useEffect(() => {
    const videoId = params.videoId as string | undefined;
    const shouldScroll = params.scrollToVideo === "true";
    
    if (videoId && shouldScroll && videos.length > 0 && !hasScrolledToVideoRef.current) {
      const videoIndex = videos.findIndex(v => v._id === videoId);
      
      if (videoIndex !== -1 && flatListRef.current) {
        console.log(`[Home] 🎬 Scrolling to video: ${videoId} at index: ${videoIndex}`);
        hasScrolledToVideoRef.current = true;
        
        // Delay một chút để đảm bảo FlatList đã render xong
        setTimeout(() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                index: videoIndex,
                animated: true,
                viewPosition: 0, // Scroll đến đầu video
              });
              setCurrentIndex(videoIndex);
            } catch (error) {
              console.log(`[Home] ⚠️ Error scrolling to index:`, error);
              // Fallback: scroll to offset
              const offset = videoIndex * SCREEN_HEIGHT;
              flatListRef.current.scrollToOffset({
                offset,
                animated: true,
              });
              setCurrentIndex(videoIndex);
            }
          }
        }, 500); // Tăng delay để đảm bảo videos đã render
      } else if (videoIndex === -1) {
        console.log(`[Home] ⚠️ Video ${videoId} not found in current videos list, will try to fetch it`);
        // Nếu video không có trong danh sách, có thể cần fetch video đó
        // Hoặc đợi videos được load thêm
      }
    }
  }, [params.videoId, params.scrollToVideo, videos]);

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

          // Nếu đã đăng nhập, check like status cho từng video bằng cách gọi API
          let processedVideos = uniqueVideos;
          if (isAuthenticated && token && userId) {
            // Gọi API check like cho tất cả videos cùng lúc (parallel)
            processedVideos = await Promise.all(
              uniqueVideos.map(async (video) => {
                // Đảm bảo likedBy là array
                let likedBy = video.likedBy || [];
                if (!Array.isArray(likedBy)) {
                  likedBy = [];
                }

                // Gọi API để check xem video đã được like chưa
                try {
                  const checkResponse = await fetch(
                    `${API_BASE_URL}/likes/check?userId=${encodeURIComponent(userId)}&targetType=video&targetId=${encodeURIComponent(video._id)}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    // Nếu API trả về isLiked hoặc liked: true
                    if (checkData.isLiked || checkData.liked) {
                      // Thêm userId vào likedBy nếu chưa có
                      if (!likedBy.includes(userId)) {
                        likedBy = [...likedBy, userId];
                      }
                    } else {
                      // Xóa userId khỏi likedBy nếu có
                      likedBy = likedBy.filter((id: string) => id !== userId);
                    }
                  } else if (checkResponse.status === 404) {
                    // Endpoint không tồn tại, giữ nguyên likedBy từ API
                    console.warn(`Like check endpoint not found for video ${video._id}`);
                  }
                } catch (error) {
                  console.error(`Error checking like status for video ${video._id}:`, error);
                  // Nếu không check được, giữ nguyên likedBy từ API
                }

                // Check follow status - kiểm tra xem đã follow user này chưa
                let isFollowing = false;
                if (video.user && video.user._id && video.user._id !== userId) {
                  try {
                    // Gọi API để lấy thông tin user hiện tại và check followingList
                    const userResponse = await fetch(
                      `${API_BASE_URL}/users/${userId}`,
                      {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      if (userData.followingList && Array.isArray(userData.followingList)) {
                        isFollowing = userData.followingList.some(
                          (id: string) => String(id) === String(video.user._id)
                        );
                      }
                    }
                  } catch (error) {
                    console.error(`Error checking follow status for user ${video.user._id}:`, error);
                  }
                }

                return {
                  ...video,
                  likedBy: likedBy,
                  isFollowing: isFollowing,
                };
              })
            );
          } else {
            // Nếu chưa đăng nhập, đảm bảo likedBy là array rỗng và isFollowing = false
            processedVideos = uniqueVideos.map((video) => ({
              ...video,
              likedBy: [],
              isFollowing: false,
            }));
          }

          setVideos(processedVideos);
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

          // Nếu đã đăng nhập, check like status cho từng video bằng cách gọi API
          let processedVideos = newVideos;
          if (isAuthenticated && token && userId) {
            processedVideos = await Promise.all(
              newVideos.map(async (video) => {
                // Đảm bảo likedBy là array
                let likedBy = video.likedBy || [];
                if (!Array.isArray(likedBy)) {
                  likedBy = [];
                }

                // Gọi API để check xem video đã được like chưa
                try {
                  const checkResponse = await fetch(
                    `${API_BASE_URL}/likes/check?userId=${encodeURIComponent(userId)}&targetType=video&targetId=${encodeURIComponent(video._id)}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    // Nếu API trả về isLiked hoặc liked: true
                    if (checkData.isLiked || checkData.liked) {
                      // Thêm userId vào likedBy nếu chưa có
                      if (!likedBy.includes(userId)) {
                        likedBy = [...likedBy, userId];
                      }
                    } else {
                      // Xóa userId khỏi likedBy nếu có
                      likedBy = likedBy.filter((id: string) => id !== userId);
                    }
                  } else if (checkResponse.status === 404) {
                    // Endpoint không tồn tại, giữ nguyên likedBy từ API
                    console.warn(`Like check endpoint not found for video ${video._id}`);
                  }
                } catch (error) {
                  console.error(`Error checking like status for video ${video._id}:`, error);
                  // Nếu không check được, giữ nguyên likedBy từ API
                }

                // Check follow status - kiểm tra xem đã follow user này chưa
                let isFollowing = false;
                if (video.user && video.user._id && video.user._id !== userId) {
                  try {
                    // Gọi API để lấy thông tin user hiện tại và check followingList
                    const userResponse = await fetch(
                      `${API_BASE_URL}/users/${userId}`,
                      {
                        method: "GET",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      if (userData.followingList && Array.isArray(userData.followingList)) {
                        isFollowing = userData.followingList.some(
                          (id: string) => String(id) === String(video.user._id)
                        );
                      }
                    }
                  } catch (error) {
                    console.error(`Error checking follow status for user ${video.user._id}:`, error);
                  }
                }

                return {
                  ...video,
                  likedBy: likedBy,
                  isFollowing: isFollowing,
                };
              })
            );
          } else {
            // Nếu chưa đăng nhập, đảm bảo likedBy là array rỗng và isFollowing = false
            processedVideos = newVideos.map((video) => ({
              ...video,
              likedBy: [],
              isFollowing: false,
            }));
          }

          // Append vào danh sách hiện tại (không replace)
          setVideos((prev) => [...prev, ...processedVideos]);
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
      if (visibleIndex !== null && visibleIndex !== undefined) {
        setCurrentIndex(visibleIndex);
      }
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Tính toán snap offsets cho từng video - đảm bảo snap chính xác đến từng video
  const snapToOffsets = videos.map((_, index) => index * SCREEN_HEIGHT);

  // Xử lý khi bắt đầu scroll - lưu index hiện tại
  const handleScrollBeginDrag = () => {
    scrollStartIndexRef.current = currentIndex;
    isScrollingRef.current = true;
    lastSnappedIndexRef.current = -1; // Reset snap tracking
    // Clear timeout nếu có
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  };

  // Xử lý scroll - chỉ theo dõi, không snap trong quá trình scroll để tránh lag
  const handleScroll = (event: any) => {
    if (!isScrollingRef.current) return;
    
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;
    const maxOffset = (startIndex + 1) * SCREEN_HEIGHT; // Chỉ cho phép xuống 1 video
    const minOffset = Math.max(0, (startIndex - 1) * SCREEN_HEIGHT); // Chỉ cho phép lên 1 video
    
    // Nếu scroll quá giới hạn, ngay lập tức snap về video đúng
    if (offsetY > maxOffset) {
      // Scroll quá xuống - snap về video bên dưới
      const targetIndex = Math.min(startIndex + 1, videos.length - 1);
      if (targetIndex !== currentIndex) {
        setCurrentIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false, // Không animate để tránh hiệu ứng "cuộn xuống rồi quay lại"
        });
      }
    } else if (offsetY < minOffset) {
      // Scroll quá lên - snap về video bên trên
      const targetIndex = Math.max(0, startIndex - 1);
      if (targetIndex !== currentIndex) {
        setCurrentIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false, // Không animate để tránh hiệu ứng "cuộn xuống rồi quay lại"
        });
      }
    }
  };

  // Xử lý khi scroll kết thúc - đảm bảo chỉ di chuyển 1 video
  const handleScrollEndDrag = (event: any) => {
    isScrollingRef.current = false;
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;
    
    // Xác định hướng scroll và video đích (threshold 15% để nhạy hơn)
    let targetIndex = startIndex;
    if (offsetY > startOffset + SCREEN_HEIGHT * 0.10) {
      // Lướt xuống đủ xa - chuyển sang video bên dưới
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - SCREEN_HEIGHT * 0.10) {
      // Lướt lên đủ xa - chuyển sang video bên trên
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      // Lướt chưa đủ xa - quay về video hiện tại
      targetIndex = startIndex;
    }
    
    // Scroll đến video đúng
    if (targetIndex !== currentIndex) {
      setCurrentIndex(targetIndex);
    }
    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
    });
  };

  // Xử lý khi momentum scroll kết thúc - đảm bảo chỉ di chuyển 1 video
  const handleMomentumScrollEnd = (event: any) => {
    isScrollingRef.current = false;
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;
    
    // Xác định hướng scroll và video đích (threshold 15% để nhạy hơn)
    let targetIndex = startIndex;
    if (offsetY > startOffset + SCREEN_HEIGHT * 0.15) {
      // Lướt xuống đủ xa - chuyển sang video bên dưới
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - SCREEN_HEIGHT * 0.15) {
      // Lướt lên đủ xa - chuyển sang video bên trên
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      // Lướt chưa đủ xa - quay về video hiện tại
      targetIndex = startIndex;
    }
    
    // Scroll đến video đúng
    if (targetIndex !== currentIndex) {
      setCurrentIndex(targetIndex);
    }
    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
    });
  };

  const handleLike = async (videoId: string) => {
    if (!userId || !isAuthenticated || !token) {
      return;
    }

    // Tìm video hiện tại để kiểm tra trạng thái like
    const currentVideo = videos.find((v) => v._id === videoId);
    if (!currentVideo) return;

    const isCurrentlyLiked = currentVideo.likedBy.includes(userId);
    const currentLikes = currentVideo.likes || currentVideo.likesCount || 0;

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id === videoId) {
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
      // Xác định endpoint và method dựa trên trạng thái like hiện tại
      const endpoint = isCurrentlyLiked ? "unlike" : "like";
      const method = "POST";

      const response = await fetch(`${API_BASE_URL}/likes/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          targetType: "video",
          targetId: videoId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} video`);
      }
    } catch (error) {
      console.error("Like error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((video) => {
          if (video._id === videoId) {
            return {
              ...video,
              likes: currentLikes,
              likesCount: currentLikes,
              likedBy: currentVideo.likedBy,
            };
          }
          return video;
        })
      );
    }
  };

  const handleComment = (videoId: string) => {
    router.push({
      pathname: "/(tabs)/home/comments",
      params: { videoId },
    });
  };

  const handleSearchIconPress = () => {
    console.log(`[Home] 🔍 Search icon pressed, navigating to search screen`);
    // Navigate thẳng tới search screen
    router.push({
      pathname: "/search",
      params: {}
    } as any);
  };

  const handleFollow = async (targetUserId: string) => {
    if (!userId || !isAuthenticated || !token || userId === targetUserId) {
      return;
    }

    // Tìm video của user này để kiểm tra trạng thái follow
    const video = videos.find((v) => v.user._id === targetUserId);
    if (!video) return;

    const isCurrentlyFollowing = video.isFollowing || false;

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((v) => {
        if (v.user._id === targetUserId) {
          return {
            ...v,
            isFollowing: !isCurrentlyFollowing,
          };
        }
        return v;
      })
    );

    try {
      const method = isCurrentlyFollowing ? "DELETE" : "POST";
      const response = await fetch(
        `${API_BASE_URL}/users/${targetUserId}/follow`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isCurrentlyFollowing ? "unfollow" : "follow"} user`);
      }
    } catch (error) {
      console.error("Follow error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((v) => {
          if (v.user._id === targetUserId) {
            return {
              ...v,
              isFollowing: isCurrentlyFollowing,
            };
          }
          return v;
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
        onVideoProgress={handleVideoProgress}
        onComment={handleComment}
        onFollow={handleFollow}
        currentUserId={userId}
        isScreenFocused={isScreenFocused}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#000", "#1a1a1a"]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Animated.View 
              style={[
                styles.loadingIconContainer,
                { transform: [{ scale: loadingIconScale }] }
              ]}
            >
              <Ionicons name="videocam" size={64} color={Colors.white} />
            </Animated.View>
            <Text style={styles.loadingTitle}>Đang tải video</Text>
            <Text style={styles.loadingSubtitle}>Vui lòng đợi trong giây lát...</Text>
            <ActivityIndicator 
              size="large" 
              color={Colors.primary} 
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        </LinearGradient>
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
        <View style={styles.loadingMoreContent}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingMoreText}>Đang tải thêm video...</Text>
        </View>
      </View>
    );
  };

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

      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item._id}
        pagingEnabled={false}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        decelerationRate="fast" // Dùng fast để snap nhanh hơn
        removeClippedSubviews={true} // Tối ưu performance
        maxToRenderPerBatch={3} // Giới hạn số item render mỗi batch
        windowSize={5} // Giới hạn window size để tối ưu
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        scrollEventThrottle={100} // Tăng lên 100ms để giảm tải xử lý
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        ListFooterComponent={renderFooter}
        onScrollToIndexFailed={(info) => {
          // Xử lý khi scroll đến index thất bại (ví dụ: index chưa render)
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
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
    backgroundColor: "#000",
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingIconContainer: {
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  loadingTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[400],
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    marginBottom: Spacing.lg,
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
  videoPressable: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heartAnimation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -40,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heartIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.max(350, SCREEN_HEIGHT * 0.4), 
  },
  userInfo: {
    position: "absolute",
    bottom: USER_INFO_BOTTOM,
    left: Spacing.md,
    right: USER_INFO_RIGHT,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    maxWidth: USER_INFO_MAX_WIDTH,
  },
  userInfoLeft: {
    flexDirection: "row",
    flex: 1,
    marginRight: Spacing.sm,
    minWidth: 0, // Cho phép shrink
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    borderWidth: 2,
    borderColor: Colors.white,
    marginRight: Spacing.sm,
    backgroundColor: Colors.gray[700],
  },
  userText: {
    flex: 1,
    minWidth: 0, // Cho phép text shrink
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs / 2,
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  username: {
    color: Colors.white,
    fontSize: SCREEN_WIDTH < 375 ? Typography.fontSize.sm : Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  title: {
    color: Colors.white,
    fontSize: SCREEN_WIDTH < 375 ? Typography.fontSize.sm : Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  descriptionContainer: {
    marginBottom: Spacing.xs / 2,
  },
  description: {
    color: Colors.white,
    fontSize: SCREEN_WIDTH < 375 ? Typography.fontSize.xs : Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  expandButton: {
    color: Colors.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs / 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hashtags: {
    color: Colors.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs / 2,
    fontFamily: Typography.fontFamily.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statsText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  followButton: {
    paddingHorizontal: SCREEN_WIDTH < 375 ? Spacing.sm : Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    alignSelf: "flex-start",
    minWidth: FOLLOW_BUTTON_MIN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  followButtonFollowing: {
    backgroundColor: Colors.gray[200],
  },
  followButtonText: {
    color: Colors.white,
    fontSize: Math.max(12, SCREEN_WIDTH * 0.03),
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  followButtonTextFollowing: {
    color: Colors.text.secondary,
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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  loadingMoreContainerOld: {
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.black,
  },
  loadingMoreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[300],
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
  loadingMoreTextOld: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
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
