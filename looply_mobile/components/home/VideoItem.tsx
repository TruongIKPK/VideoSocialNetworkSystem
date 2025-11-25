import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { VideoPost } from "@/types/video";
import { Dimensions } from "react-native";
import { useReport } from "@/hooks/useReport";
import { ReportModal } from "@/components/report/ReportModal";
import { useUser } from "@/contexts/UserContext";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { shareVideo } from "@/utils/shareHelpers";

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
  onVideoStart?: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onSave?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  currentUserId: string | null;
  isScreenFocused: boolean;
}

export const VideoItem = ({
  item,
  index,
  isCurrent,
  onLike,
  onVideoProgress,
  onVideoStart,
  onComment,
  onFollow,
  onSave,
  onShare,
  currentUserId,
  isScreenFocused,
}: VideoItemProps) => {
  // Kiểm tra xem video đã được like chưa
  const isLiked =
    currentUserId &&
    item.likedBy &&
    Array.isArray(item.likedBy) &&
    item.likedBy.includes(currentUserId);
  
  // Kiểm tra xem video đã được save chưa
  const isSaved = currentUserId 
    ? (item.savedBy || []).includes(currentUserId)
    : false;
  
  // Debug log
  useEffect(() => {
    if (isCurrent) {
      console.log(`[VideoItem] Video ${item._id}:`, {
        savedBy: item.savedBy,
        currentUserId,
        isSaved,
        savesCount: item.saves || item.savesCount || 0
      });
    }
  }, [isCurrent, item.savedBy, currentUserId, isSaved, item._id]);
  
  const likesCount = item.likes || item.likesCount || 0;
  const commentsCount = item.comments || item.commentsCount || 0;
  const sharesCount = item.shares || 0;
  const savesCount = item.saves || item.savesCount || 0;
  const viewsCount = item.views || 0;

  const watchTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState<"video" | "user">("video");
  const heartScale = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const { token } = useUser();
  const { createReport, isSubmitting } = useReport({ token });
  const { showAlert, AlertComponent } = useCustomAlert();
  const router = useRouter();
  const { t } = useTranslation();

  // Kiểm tra xem description có dài không (ước tính > 100 ký tự hoặc > 2 dòng)
  const isDescriptionLong = item.description && item.description.length > 100;

  // Function to close modal
  const handleCloseModal = () => {
    Animated.spring(modalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 30,
      friction: 10,
    }).start(() => {
      setIsDescriptionModalVisible(false);
    });
  };

  // Handle report
  const handleReportPress = (type: "video" | "user") => {
    setReportType(type);
    setIsReportModalVisible(true);
  };

  const handleReportSubmit = async (reason: any) => {
    const reportedId = reportType === "video" ? item._id : item.user._id;
    const result = await createReport(reportType, reportedId, reason);
    
    if (result.success) {
      showAlert({
        title: t("common.success"),
        message: result.message,
        type: "success",
      });
      setIsReportModalVisible(false);
    } else {
      showAlert({
        title: t("common.error"),
        message: result.message,
        type: "error",
      });
    }
  };

  const handleShare = async () => {
    const result = await shareVideo({
      _id: item._id,
      title: item.title,
      description: item.description,
      user: item.user,
    });

    if (result.success && onShare) {
      onShare(item._id);
    }
  };

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
      try {
        if (player) {
          player.play();
          // Record video view ngay khi bắt đầu phát
          if (onVideoStart) {
            onVideoStart(item._id);
          }
          // Bắt đầu đếm thời gian xem
          watchTimeRef.current = 0;
          intervalRef.current = setInterval(() => {
            watchTimeRef.current += 1;

            // Gửi thông tin sau mỗi 5 giây
            if (watchTimeRef.current % 5 === 0) {
              onVideoProgress(item._id, watchTimeRef.current);
            }
          }, 1000);
        }
      } catch (error) {
        console.error(`[VideoItem] Error playing video ${item._id}:`, error);
      }
    } else {
      try {
        if (player) {
          player.pause();
        }
      } catch (error) {
        // Player có thể đã bị release, ignore error
        console.log(`[VideoItem] Player already released when pausing video ${item._id}`);
      }

      // Dừng đếm và gửi thông tin cuối cùng
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (watchTimeRef.current > 0) {
          onVideoProgress(item._id, watchTimeRef.current);
        }
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCurrent, player, isPaused, isScreenFocused, item._id, onVideoStart, onVideoProgress]);

  // Cleanup video player khi component unmount hoặc không còn current
  useEffect(() => {
    if (!isCurrent) {
      // Pause và reset player khi không còn visible
      try {
        if (player) {
          player.pause();
          // Không reset currentTime vì có thể gây lỗi
        }
      } catch (error) {
        // Player có thể đã bị release, ignore error
        console.log(`[VideoItem] Player already released for video ${item._id}`);
      }
    }

    return () => {
      // Cleanup khi unmount
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Không gọi player.pause() trong cleanup vì player có thể đã bị release
      // expo-video sẽ tự động cleanup player khi component unmount
    };
  }, [isCurrent, player, item._id]);

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
          contentFit="contain"
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
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/user/[userId]",
                params: {
                  userId: item.user._id,
                  username: item.user.name,
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Image
              source={getAvatarUri(item.user.avatar)}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.userText}>
            <View style={styles.userHeader}>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/user/[userId]",
                    params: {
                      userId: item.user._id,
                      username: item.user.name,
                    },
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.username} numberOfLines={1}>
                  {item.user.name}
                </Text>
              </TouchableOpacity>
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
                    onPress={() => {
                      setIsDescriptionModalVisible(true);
                      Animated.spring(modalSlideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 40,
                        friction: 10,
                      }).start();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButton}>{t("video.showMore")}</Text>
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
        <View style={styles.userActions}>
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
                {item.isFollowing ? t("common.following") : t("common.follow")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSave && onSave(item._id)}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={30}
            color={isSaved ? "#FFD700" : "#FFF"}
          />
          {savesCount > 0 && (
            <Text style={styles.actionText}>{formatNumber(savesCount)}</Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={30} color="#FFF" />
          <Text style={styles.actionText}>{formatNumber(sharesCount)}</Text>
        </TouchableOpacity>

        {/* Report Video */}
        {currentUserId && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReportPress("video")}
          >
            <Ionicons name="flag-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Description Modal */}
      <Modal
        visible={isDescriptionModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <SafeAreaView style={styles.modalSafeArea} edges={["bottom"]}>
              {/* Handle bar */}
              <View style={styles.modalHandleContainer}>
                <View style={styles.modalHandle} />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("video.description")}</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={Colors.black} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.modalDescription}>{item.description}</Text>
                {item.hashtags && item.hashtags.length > 0 && (
                  <View style={styles.modalHashtagsContainer}>
                    <Text style={styles.modalHashtags}>
                      {item.hashtags.map((tag) => `#${tag}`).join(" ")}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={handleReportSubmit}
        type={reportType}
        isSubmitting={isSubmitting}
      />

      {/* Custom Alert */}
      <AlertComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  videoPressable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignSelf: "center",
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
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  reportButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[100],
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: SCREEN_HEIGHT * 0.7,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHandleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[600],
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[800],
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.black,
    fontFamily: Typography.fontFamily.bold,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  modalDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.black,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  modalHashtagsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[800],
  },
  modalHashtags: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
});

