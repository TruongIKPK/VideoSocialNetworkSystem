import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { useReport } from "@/hooks/useReport";
import { ReportModal } from "@/components/report/ReportModal";
import { useCustomAlert } from "@/hooks/useCustomAlert";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface CommentUser {
  _id: string;
  name: string;
  avatar: string;
}

interface Comment {
  _id: string;
  text: string;
  videoId: string;
  userId: string | CommentUser;
  parentId?: string | null;
  likesCount?: number;
  likedUsers?: string[];
  createdAt: string;
  updatedAt?: string;
}

function formatCommentTime(dateInput: Date | string) {
  const date = new Date(dateInput);

  if (isToday(date)) {
    return format(date, "HH:mm");
  }

  if (isYesterday(date)) {
    return "Hôm qua";
  }

  return format(date, "dd/MM/yyyy", { locale: vi });
}

export default function CommentsModal() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { isAuthenticated, token } = useUser();
  const { user } = useCurrentUser();
  const Colors = useColors(); // Get theme-aware colors
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { createReport, isSubmitting: isSubmittingReport } = useReport({ token });
  const { showAlert, AlertComponent } = useCustomAlert();
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/comments/${videoId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      // API đã populate user info, không cần fetch thêm
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !isAuthenticated || !token) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: commentText.trim(),
          videoId,
          parentId: replyingTo || null,
        }),
      });

      if (response.ok) {
        setCommentText("");
        setReplyingTo(null);
        // Refresh comments
        await fetchComments();
        // Scroll to top to show new comment
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated || !token || !user?._id) return;

    const comment = comments.find((c) => c._id === commentId);
    if (!comment) return;

    const userId = typeof user._id === "string" ? user._id : String(user._id);
    const isLiked = comment.likedUsers?.some(
      (id) => (typeof id === "string" ? id : String(id)) === userId
    );
    const endpoint = isLiked ? "unlike" : "like";

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const currentLikes = c.likesCount || 0;
          const currentLikedUsers = c.likedUsers || [];
          return {
            ...c,
            likesCount: isLiked ? currentLikes - 1 : currentLikes + 1,
            likedUsers: isLiked
              ? currentLikedUsers.filter(
                  (id) => (typeof id === "string" ? id : String(id)) !== userId
                )
              : [...currentLikedUsers, userId],
          };
        }
        return c;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Revert on error
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === commentId) {
              const currentLikes = c.likesCount || 0;
              const currentLikedUsers = c.likedUsers || [];
              return {
                ...c,
            likesCount: isLiked ? currentLikes + 1 : currentLikes - 1,
            likedUsers: isLiked
              ? [...currentLikedUsers, userId]
              : currentLikedUsers.filter(
                  (id) => (typeof id === "string" ? id : String(id)) !== userId
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const commentUser =
      typeof item.userId === "object" && item.userId
        ? item.userId
        : { _id: "", name: "User", avatar: "" };
    const userId = user?._id ? (typeof user._id === "string" ? user._id : String(user._id)) : "";
    const isLiked = userId && item.likedUsers?.some(
      (id) => (typeof id === "string" ? id : String(id)) === userId
    );
    const likesCount = item.likesCount || 0;

    return (
      <View style={styles.commentItem}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/user/[userId]",
              params: {
                userId: commentUser._id,
                username: commentUser.name,
              },
            });
          }}
          activeOpacity={0.7}
        >
          <Image
            source={getAvatarUri(commentUser.avatar)}
            style={styles.commentAvatar}
            contentFit="cover"
          />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/user/[userId]",
                  params: {
                    userId: commentUser._id,
                    username: commentUser.name,
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.commentUserName}>{commentUser.name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              {formatCommentTime(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => setReplyingTo(item._id)}
            >
              <Text style={styles.commentActionText}>Trả lời</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={() => handleLikeComment(item._id)}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={16}
                color={isLiked ? Colors.error : Colors.gray[400]}
              />
              {likesCount > 0 && (
                <Text style={styles.commentLikesCount}>{formatNumber(likesCount)}</Text>
              )}
            </TouchableOpacity>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.commentActionButton}
                onPress={() => {
                  setReportingCommentId(item._id);
                  setIsReportModalVisible(true);
                }}
              >
                <Ionicons name="flag-outline" size={16} color={Colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bình luận</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-outline"
              size={64}
              color={Colors.gray[400]}
            />
            <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
            <Text style={styles.emptySubtext}>
              Hãy là người đầu tiên bình luận!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={renderComment}
            contentContainerStyle={[styles.commentsList, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        {isAuthenticated && user ? (
          <View style={styles.inputContainer}>
            {replyingTo && (
              <View style={styles.replyingIndicator}>
                <Text style={styles.replyingText}>
                  Đang trả lời{" "}
                  {comments.find((c) => c._id === replyingTo)?.userId &&
                    typeof comments.find((c) => c._id === replyingTo)?.userId ===
                      "object" &&
                    (comments.find((c) => c._id === replyingTo)?.userId as CommentUser)
                      .name}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <Image
                source={getAvatarUri(user.avatar)}
                style={styles.userAvatar}
                contentFit="cover"
              />
              <TextInput
                style={styles.textInput}
                placeholder="Nhập bình luận..."
                placeholderTextColor={Colors.gray[400]}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (!commentText.trim() || isSubmitting) && styles.postButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.postButtonText}>Đăng</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Đăng nhập để bình luận
            </Text>
          </View>
        )}

        {/* Report Modal */}
        <ReportModal
          visible={isReportModalVisible}
          onClose={() => {
            setIsReportModalVisible(false);
            setReportingCommentId(null);
          }}
          onSubmit={async (reason) => {
            if (reportingCommentId) {
              const result = await createReport("comment", reportingCommentId, reason);
              if (result.success) {
                showAlert({
                  title: "Thành công",
                  message: result.message,
                  type: "success",
                });
                setIsReportModalVisible(false);
                setReportingCommentId(null);
              } else {
                showAlert({
                  title: "Lỗi",
                  message: result.message,
                  type: "error",
                });
              }
            }
          }}
          type="comment"
          isSubmitting={isSubmittingReport}
        />

        {/* Custom Alert */}
        <AlertComponent />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.white,
    },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.medium,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  commentsList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.avatar,
    marginRight: Spacing.sm,
    backgroundColor: Colors.gray[200],
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs / 2,
    gap: Spacing.sm,
  },
  commentUserName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  commentTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontFamily: Typography.fontFamily.regular,
  },
  commentText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
  },
  commentActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  commentLikesCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: 120, // Thêm padding bottom để tránh bị tab bar che
  },
  replyingIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.gray[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  replyingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.avatar,
    backgroundColor: Colors.gray[200],
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    maxHeight: 100,
    ...Shadows.sm,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    backgroundColor: Colors.gray[300],
    opacity: 0.6,
  },
  postButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  loginPrompt: {
    padding: Spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  loginPromptText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  });
};

