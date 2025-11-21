import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { VideoPost } from "@/types/video";
import { Dimensions } from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive values
const AVATAR_SIZE = Math.min(52, SCREEN_WIDTH * 0.13);
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const USER_INFO_BOTTOM = Math.max(100, SCREEN_HEIGHT * 0.12);
const USER_INFO_RIGHT = Math.max(90, SCREEN_WIDTH * 0.22);
const USER_INFO_MAX_WIDTH = SCREEN_WIDTH * 0.78;
const FOLLOW_BUTTON_MIN_WIDTH = Math.max(70, SCREEN_WIDTH * 0.18);

interface VideoItemProps {
  item: VideoPost;
  index: number;
  isCurrent: boolean;
  onLike: (videoId: string) => void;
  onVideoProgress: (videoId: string, duration: number) => void;
  onComment: (videoId: string) => void;
  onFollow: (userId: string) => void;
  currentUserId: string | null;
  isScreenFocused: boolean;
}

export const VideoItem = ({
  item,
  index,
  isCurrent,
  onLike,
  onVideoProgress,
  onComment,
  onFollow,
  currentUserId,
  isScreenFocused,
}: VideoItemProps) => {
  // Kiểm tra xem video đã được like chưa
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
              item.isFollowing && styles.followButtonFollowing,
            ]}
            activeOpacity={0.7}
            onPress={() => onFollow(item.user._id)}
          >
            <Text
              style={[
                styles.followButtonText,
                item.isFollowing && styles.followButtonTextFollowing,
              ]}
            >
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

const styles = StyleSheet.create({
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
});

