import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Report {
  _id: string;
  reporterId?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
    email?: string;
  };
  reportedType: string;
  reportedId: string;
  reason: string;
  status: string;
  resolvedBy?: {
    _id: string;
    name?: string;
    username?: string;
  };
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useCurrentUser();
  const { token } = useUser();
  
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentData, setCommentData] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;

  useEffect(() => {
    if (reportId && token) {
      fetchReport();
    }
  }, [reportId, token]);

  // Fetch comment or video content when report is loaded (chỉ khi chưa có reportedContent)
  useEffect(() => {
    if (report && token) {
      // Nếu đã có reportedContent từ API, không cần fetch lại
      if (report.reportedContent) {
        console.log("[Report Detail] reportedContent already available from API");
        return;
      }
      
      // Nếu chưa có reportedContent, fetch riêng
      // Đặc biệt quan trọng khi API getReportWithContent không trả về content
      if (report.reportedType && report.reportedId) {
        console.log("[Report Detail] reportedContent not found, fetching separately...");
        fetchReportedContent();
      }
    }
  }, [report, token]);

  const fetchReportedContent = async () => {
    if (!report || !token) {
      console.warn("[Report Detail] Missing report or token");
      return;
    }

    try {
      setIsLoadingContent(true);
      console.log(`[Report Detail] Fetching content for ${report.reportedType}: ${report.reportedId}`);

      // Reset tất cả content data trước khi fetch
      setCommentData(null);
      setVideoData(null);
      setUserData(null);

      // CHỈ fetch và set đúng loại content tương ứng với reportedType
      if (report.reportedType === "comment") {
        // Fetch comment data
        const commentUrl = `${API_BASE_URL}/comments/id/${report.reportedId}`;
        console.log(`[Report Detail] Fetching comment from: ${commentUrl}`);
        
        const commentResponse = await fetch(commentUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`[Report Detail] Comment response status: ${commentResponse.status}`);

        if (commentResponse.ok) {
          const data = await commentResponse.json();
          console.log(`[Report Detail] ✅ Comment data received:`, {
            _id: data._id,
            hasText: !!data.text,
            textLength: data.text?.length || 0,
            hasUserId: !!data.userId,
            hasVideoId: !!data.videoId,
          });
          setCommentData(data);
        } else {
          const contentType = commentResponse.headers.get("content-type");
          let errorText = "";
          
          try {
            errorText = await commentResponse.text();
            console.error(`[Report Detail] ❌ Failed to fetch comment: ${commentResponse.status}`);
            console.error(`[Report Detail] Error response:`, errorText.substring(0, 200));
            
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = JSON.parse(errorText);
                console.error(`[Report Detail] Error details:`, errorData);
              } catch (e) {
                // Not JSON - có thể là HTML error page
                console.error(`[Report Detail] Non-JSON error response (likely 404 HTML page)`);
              }
            }
          } catch (e) {
            console.error("[Report Detail] Error reading comment response:", e);
          }
          
          // Nếu route không tồn tại (404), thử dùng API getReportWithContent đã có
          if (commentResponse.status === 404) {
            console.warn("[Report Detail] Comment route 404, but we should have gotten content from getReportWithContent");
            // Không set null ngay, có thể API getReportWithContent đã trả về data
          } else {
            // Set commentData to null để hiển thị error state
            setCommentData(null);
          }
        }
      } else if (report.reportedType === "video") {
        // Fetch video data
        const videoResponse = await fetch(`${API_BASE_URL}/admin/videos/${report.reportedId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (videoResponse.ok) {
          const data = await videoResponse.json();
          setVideoData(data);
        } else {
          console.error("Failed to fetch video:", videoResponse.status);
        }
      } else if (report.reportedType === "user") {
        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/users/${report.reportedId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user:", userResponse.status);
        }
      }
    } catch (error) {
      console.error("Error fetching reported content:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      if (!token) {
        console.warn("No token available");
        return;
      }

      // Sử dụng API getReportWithContent để lấy report kèm nội dung được báo cáo
      const response = await fetch(`${API_BASE_URL}/reports/with-content/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Report Detail] Report with content received:", {
          hasReportedContent: !!data.reportedContent,
          reportedType: data.reportedType,
          reportedId: data.reportedId,
        });
        setReport(data);
        
        // Reset tất cả content data trước khi set mới
        setCommentData(null);
        setVideoData(null);
        setUserData(null);
        
        // Set content data từ reportedContent nếu có - CHỈ set đúng loại tương ứng
        if (data.reportedContent) {
          console.log("[Report Detail] Setting content from reportedContent:", {
            type: data.reportedType,
            hasText: data.reportedType === "comment" ? !!data.reportedContent.text : false,
          });
          
          // CHỈ set data cho loại được report, không set các loại khác
          if (data.reportedType === "comment") {
            setCommentData(data.reportedContent);
            setIsLoadingContent(false);
          } else if (data.reportedType === "video") {
            setVideoData(data.reportedContent);
            setIsLoadingContent(false);
          } else if (data.reportedType === "user") {
            setUserData(data.reportedContent);
            setIsLoadingContent(false);
          }
        } else {
          // Nếu không có reportedContent, sẽ fetch riêng trong useEffect
          console.warn("[Report Detail] No reportedContent in response, will fetch separately");
        }
      } else {
        // Fallback: Nếu API with-content không hoạt động, dùng API thông thường
        console.warn("⚠️ getReportWithContent failed, using fallback");
        const fallbackResponse = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setReport(data);
          // Fetch content separately
          if (data.reportedType && data.reportedId) {
            fetchReportedContent();
          }
        } else {
          const errorText = await fallbackResponse.text();
          console.error("Failed to fetch report:", fallbackResponse.status, errorText);
          Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
        }
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !reportId) {
      Alert.alert("Lỗi", "Không có token hoặc report ID");
      return;
    }

    try {
      setIsUpdating(true);

      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedReport = await response.json();
        setReport(updatedReport.report);
        Alert.alert("Thành công", `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật trạng thái");
      }
    } catch (error: any) {
      console.error("Error updating report status:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "resolved":
        return "Đã xử lý";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "pending":
        return "#F59E0B";
      default:
        return Colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy báo cáo</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(admin)/reports")}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.replace("/(admin)/reports")}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Info Card */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin báo cáo</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(report.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(report.status) },
                ]}
              >
                {getStatusText(report.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Báo cáo:</Text>
            <Text style={styles.infoValue}>#{report._id.slice(-6)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loại:</Text>
            <Text style={styles.infoValue}>
              {report.reportedType === "video"
                ? "Video"
                : report.reportedType === "user"
                ? "Người dùng"
                : report.reportedType === "comment"
                ? "Bình luận"
                : report.reportedType}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Đối tượng:</Text>
            <Text style={styles.infoValue}>{report.reportedId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người báo cáo:</Text>
            <View style={styles.reporterInfo}>
              {report.reporterId?.avatar && (
                <Image
                  source={getAvatarUri(report.reporterId.avatar)}
                  style={styles.reporterAvatar}
                />
              )}
              <Text style={styles.infoValue}>
                {report.reporterId?.name ||
                  report.reporterId?.username ||
                  "Unknown"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.reasonHeader}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.infoLabel}>Lý do báo cáo:</Text>
            </View>
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonText}>{report.reason}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>{formatDate(report.createdAt)}</Text>
          </View>

          {report.resolvedBy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người xử lý:</Text>
              <Text style={styles.infoValue}>
                {report.resolvedBy.name || report.resolvedBy.username || "Unknown"}
              </Text>
            </View>
          )}

          {report.resolvedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày xử lý:</Text>
              <Text style={styles.infoValue}>{formatDate(report.resolvedAt)}</Text>
            </View>
          )}
          </View>
        </View>

        {/* Comment Content Card */}
        {report.reportedType === "comment" && (
          <View style={styles.card}>
            <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#F59E0B" />
                <Text style={styles.cardTitle}>Nội dung comment được báo cáo</Text>
              </View>
            </View>
            
            {isLoadingContent ? (
              <View style={styles.contentLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.contentLoadingText}>Đang tải nội dung comment...</Text>
              </View>
            ) : commentData && commentData._id ? (
              <>
                <View style={styles.reportedContentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      {commentData.userId?.avatar && (
                        <Image
                          source={getAvatarUri(commentData.userId.avatar)}
                          style={styles.commentUserAvatar}
                        />
                      )}
                      <View style={styles.commentUserDetails}>
                        <Text style={styles.commentUserName}>
                          {commentData.userId?.name || commentData.userId?.username || "Unknown"}
                        </Text>
                        <Text style={styles.commentDate}>
                          {formatDate(commentData.createdAt)}
                        </Text>
                      </View>
                    </View>
                    {commentData.status === "violation" && (
                      <View style={styles.violationStatusBadge}>
                        <Ionicons name="warning" size={14} color="#EF4444" />
                        <Text style={styles.violationStatusText}>Đã vi phạm</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.reportedContentHighlight}>
                    <View style={styles.reportedContentLabel}>
                      <Ionicons name="flag" size={16} color="#EF4444" />
                      <Text style={styles.reportedContentLabelText}>Nội dung được báo cáo:</Text>
                    </View>
                    <View style={styles.commentContentBox}>
                      <Text style={styles.commentText}>
                        {commentData.text || "Không có nội dung"}
                      </Text>
                    </View>
                  </View>
                  {commentData.likesCount > 0 && (
                    <View style={styles.commentStats}>
                      <Ionicons name="heart" size={16} color={Colors.error} />
                      <Text style={styles.commentStatsText}>
                        {formatNumber(commentData.likesCount)} lượt thích
                      </Text>
                    </View>
                  )}
                </View>
                
                {commentData.videoId && (
                  <View style={styles.videoContextCard}>
                    <Text style={styles.videoContextTitle}>Comment này thuộc video:</Text>
                    <View style={styles.videoContextInfo}>
                      {commentData.videoId.thumbnail && (
                        <Image
                          source={{ uri: commentData.videoId.thumbnail }}
                          style={styles.videoContextThumbnail}
                        />
                      )}
                      <View style={styles.videoContextDetails}>
                        <Text style={styles.videoContextName} numberOfLines={2}>
                          {commentData.videoId.title || "Untitled Video"}
                        </Text>
                        {commentData.videoId.user && (
                          <Text style={styles.videoContextAuthor}>
                            {commentData.videoId.user.name || commentData.videoId.user.username || "Unknown"}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewVideoButton}
                      onPress={() => {
                        router.push({
                          pathname: "/(admin)/videos/video-detail",
                          params: {
                            videoId: commentData.videoId._id,
                            videoUrl: commentData.videoId.url || commentData.videoId.thumbnail || "",
                            title: commentData.videoId.title || "Untitled Video",
                            author: commentData.videoId.user?.name || "Unknown",
                            views: "0",
                            authorId: commentData.videoId.user?._id || "",
                            commentId: commentData._id,
                            highlightComment: "true",
                          },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="videocam" size={20} color={Colors.white} />
                      <Text style={styles.viewVideoButtonText}>Xem video và comment</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.errorContentContainer}>
                <Ionicons name="alert-circle" size={24} color={Colors.text.secondary} />
                <Text style={styles.noContentText}>Không thể tải nội dung comment</Text>
                <Text style={styles.errorDetailText}>
                  Comment ID: {report.reportedId}
                </Text>
                <Text style={styles.errorDetailText}>
                  Vui lòng kiểm tra lại API hoặc comment có tồn tại không
                </Text>
              </View>
            )}
            </View>
          </View>
        )}

        {/* Video Content Card */}
        {report.reportedType === "video" && (
          <View style={styles.card}>
            <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="videocam" size={24} color="#EF4444" />
                <Text style={styles.cardTitle}>Nội dung video được báo cáo</Text>
              </View>
            </View>
            
            {isLoadingContent ? (
              <View style={styles.contentLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.contentLoadingText}>Đang tải thông tin video...</Text>
              </View>
            ) : videoData ? (
              <>
                <View style={styles.reportedContentCard}>
                  <View style={styles.reportedContentLabel}>
                    <Ionicons name="flag" size={16} color="#EF4444" />
                    <Text style={styles.reportedContentLabelText}>Video được báo cáo:</Text>
                  </View>
                  {videoData.thumbnail && (
                    <Image
                      source={{ uri: videoData.thumbnail }}
                      style={styles.videoThumbnail}
                    />
                  )}
                  <View style={styles.videoInfoContainer}>
                    <View style={styles.videoTitleRow}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {videoData.title || "Untitled Video"}
                      </Text>
                      {videoData.status === "violation" && (
                        <View style={styles.violationStatusBadge}>
                          <Ionicons name="warning" size={14} color="#EF4444" />
                          <Text style={styles.violationStatusText}>Đã vi phạm</Text>
                        </View>
                      )}
                    </View>
                    {videoData.description && (
                      <View style={styles.videoDescriptionContainer}>
                        <Text style={styles.videoDescriptionLabel}>Mô tả:</Text>
                        <Text style={styles.videoDescription} numberOfLines={5}>
                          {videoData.description}
                        </Text>
                      </View>
                    )}
                    <View style={styles.videoMeta}>
                      {videoData.user && (
                        <View style={styles.videoAuthor}>
                          {videoData.user.avatar && (
                            <Image
                              source={getAvatarUri(videoData.user.avatar)}
                              style={styles.videoAuthorAvatar}
                            />
                          )}
                          <Text style={styles.videoAuthorName}>
                            {videoData.user.name || videoData.user.username || "Unknown"}
                          </Text>
                        </View>
                      )}
                      <View style={styles.videoStats}>
                        {videoData.views !== undefined && (
                          <View style={styles.videoStatItem}>
                            <Ionicons name="eye" size={16} color={Colors.text.secondary} />
                            <Text style={styles.videoStatText}>
                              {formatNumber(videoData.views)}
                            </Text>
                          </View>
                        )}
                        {videoData.createdAt && (
                          <Text style={styles.videoDate}>
                            {formatDate(videoData.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.viewVideoButton}
                  onPress={() => {
                    router.push({
                      pathname: "/(admin)/videos/video-detail",
                      params: {
                        videoId: videoData._id,
                        videoUrl: videoData.url || videoData.thumbnail || "",
                        title: videoData.title || "Untitled Video",
                        author: videoData.user?.name || "Unknown",
                        views: String(videoData.views || 0),
                        authorId: videoData.user?._id || "",
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-circle" size={20} color={Colors.white} />
                  <Text style={styles.viewVideoButtonText}>Xem video chi tiết</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.errorContentContainer}>
                <Ionicons name="alert-circle" size={24} color={Colors.text.secondary} />
                <Text style={styles.noContentText}>Không thể tải thông tin video</Text>
              </View>
            )}
            </View>
          </View>
        )}

        {/* User Content Card */}
        {report.reportedType === "user" && (
          <View style={styles.card}>
            <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person" size={24} color="#3B82F6" />
                <Text style={styles.cardTitle}>Người dùng được báo cáo</Text>
              </View>
            </View>
            
            {isLoadingContent ? (
              <View style={styles.contentLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.contentLoadingText}>Đang tải thông tin người dùng...</Text>
              </View>
            ) : userData ? (
              <>
                <View style={styles.reportedContentCard}>
                  <View style={styles.reportedContentLabel}>
                    <Ionicons name="flag" size={16} color="#EF4444" />
                    <Text style={styles.reportedContentLabelText}>Người dùng được báo cáo:</Text>
                  </View>
                  <View style={styles.userContentBox}>
                    <View style={styles.userHeader}>
                      {userData.avatar && (
                        <Image
                          source={getAvatarUri(userData.avatar)}
                          style={styles.userAvatar}
                        />
                      )}
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {userData.name || userData.username || "Unknown"}
                        </Text>
                        <Text style={styles.userUsername}>@{userData.username || "unknown"}</Text>
                        {userData.email && (
                          <Text style={styles.userEmail}>{userData.email}</Text>
                        )}
                      </View>
                      {userData.status === "locked" && (
                        <View style={styles.violationStatusBadge}>
                          <Ionicons name="lock-closed" size={14} color="#EF4444" />
                          <Text style={styles.violationStatusText}>Đã khóa</Text>
                        </View>
                      )}
                    </View>
                    {userData.bio && (
                      <View style={styles.userBioContainer}>
                        <Text style={styles.userBioLabel}>Giới thiệu:</Text>
                        <Text style={styles.userBio}>{userData.bio}</Text>
                      </View>
                    )}
                    <View style={styles.userMeta}>
                      <Text style={styles.userMetaText}>
                        Trạng thái: {userData.status === "active" ? "Hoạt động" : userData.status === "locked" ? "Đã khóa" : userData.status}
                      </Text>
                      {userData.createdAt && (
                        <Text style={styles.userMetaText}>
                          Tham gia: {formatDate(userData.createdAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.viewVideoButton}
                  onPress={() => {
                    router.push({
                      pathname: "/(tabs)/profile/[userId]",
                      params: {
                        userId: userData._id,
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-circle" size={20} color={Colors.white} />
                  <Text style={styles.viewVideoButtonText}>Xem profile người dùng</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.errorContentContainer}>
                <Ionicons name="alert-circle" size={24} color={Colors.text.secondary} />
                <Text style={styles.noContentText}>Không thể tải thông tin người dùng</Text>
                <Text style={styles.errorDetailText}>
                  User ID: {report.reportedId}
                </Text>
              </View>
            )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {report.status === "pending" && (
          <View style={styles.actionsCard}>
            <View style={styles.cardContent}>
            <Text style={styles.actionsTitle}>Thao tác</Text>
            <View style={styles.actionsButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.resolveButton]}
                onPress={() => handleUpdateStatus("resolved")}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Xử lý</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleUpdateStatus("rejected")}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Từ chối</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingVertical: Spacing.md,
    paddingHorizontal: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  headerBackButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    marginBottom: Spacing.md,
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  reporterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reporterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray[200],
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  reasonContainer: {
    marginTop: Spacing.xs,
  },
  reasonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 24,
    backgroundColor: "#FEF3C7",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "#F59E0B",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    fontWeight: Typography.fontWeight.medium,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reportedContentCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  reportedContentHighlight: {
    marginTop: Spacing.sm,
  },
  reportedContentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "#EF4444",
  },
  reportedContentLabelText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#EF4444",
    fontFamily: Typography.fontFamily.bold,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  commentContentBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 2,
    borderColor: "#EF4444",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  violationStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF444420",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  violationStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: "#EF4444",
    fontFamily: Typography.fontFamily.medium,
  },
  commentStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  commentStatsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoContextCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  videoContextTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
  },
  videoContextInfo: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  videoContextThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
  },
  videoContextDetails: {
    flex: 1,
    justifyContent: "center",
  },
  videoContextName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  videoContextAuthor: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoInfoContainer: {
    marginTop: Spacing.sm,
  },
  videoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  videoDescriptionContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "#EF4444",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  videoDescriptionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: "#EF4444",
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  videoDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    fontWeight: Typography.fontWeight.medium,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  videoStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoStatText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  errorContentContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    marginBottom: Spacing.md,
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  actionsButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  resolveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  contentLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  contentLoadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  commentContentCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  commentUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  commentDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  commentText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 24,
    fontWeight: Typography.fontWeight.medium,
  },
  videoContentCard: {
    marginTop: Spacing.sm,
  },
  videoThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
    marginBottom: Spacing.sm,
  },
  videoInfo: {
    gap: Spacing.xs,
  },
  videoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  videoAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  videoAuthorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray[200],
  },
  videoAuthorName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  videoViews: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  viewVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  viewVideoButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  noContentText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    fontWeight: Typography.fontWeight.semibold,
  },
  errorDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  userContentBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[200],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  userUsername: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  userBioContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  userBioLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  userBio: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  userMeta: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.xs,
  },
  userMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});

