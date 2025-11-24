import React, { useState, useEffect, useMemo } from "react";
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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
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
  const Colors = useColors(); // Get theme-aware colors
  
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track which action is updating: "resolved" | "rejected" | null
  const [commentData, setCommentData] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;

  // Video player cho video được báo cáo
  const videoUrl = videoData?.url || videoData?.thumbnail || "";
  const videoPlayer = useVideoPlayer(
    videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    (player) => {
      player.loop = true;
      player.muted = true;
      if (videoUrl) {
        player.play();
      }
    }
  );

  // Update player khi videoData thay đổi
  useEffect(() => {
    if (videoData && videoPlayer) {
      const newUrl = videoData.url || videoData.thumbnail || "";
      if (newUrl) {
        videoPlayer.replace(newUrl);
        videoPlayer.play();
      }
    }
  }, [videoData?.url, videoData?.thumbnail]);

  // Dừng video khi màn hình mất focus (navigate away)
  useFocusEffect(
    React.useCallback(() => {
      // Khi màn hình được focus, không làm gì (video đã đang phát)
      return () => {
        // Khi màn hình mất focus (navigate away), dừng video
        try {
          if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
          }
        } catch (error) {
          // Video player already released
        }
      };
    }, [videoPlayer])
  );

  // Dừng video khi component unmount
  useEffect(() => {
    return () => {
      try {
        if (videoPlayer) {
          videoPlayer.pause();
          videoPlayer.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
        }
      } catch (error) {
        console.log("[Report Detail] Video player already released, skipping pause");
      }
    };
  }, [videoPlayer]);

  useEffect(() => {
    if (reportId && token) {
      fetchReport();
    }
  }, [reportId, token]);

  // Reload khi quay lại trang
  useFocusEffect(
    React.useCallback(() => {
      if (reportId && token) {
        fetchReport();
      }
    }, [reportId, token])
  );

  // Fetch comment or video content when report is loaded (chỉ khi chưa có content data)
  useEffect(() => {
    if (report && token) {
      // Kiểm tra xem đã có content data chưa
      const hasContent = 
        (report.reportedType === "comment" && commentData) ||
        (report.reportedType === "video" && videoData) ||
        (report.reportedType === "user" && userData);
      
      if (hasContent) {
        return;
      }
      
      // Nếu chưa có content data, fetch riêng
      // Đặc biệt quan trọng khi API getReportWithContent không trả về content
      if (report.reportedType && report.reportedId) {
        fetchReportedContent();
      }
    }
  }, [report, token]);

  const fetchReportedContent = async () => {
    if (!report || !token) {
      return;
    }

    try {
      setIsLoadingContent(true);

      // Reset tất cả content data trước khi fetch
      setCommentData(null);
      setVideoData(null);
      setUserData(null);

      // CHỈ fetch và set đúng loại content tương ứng với reportedType
      if (report.reportedType === "comment") {
        // Fetch comment data
        const commentUrl = `${API_BASE_URL}/comments/id/${report.reportedId}`;
        
        const commentResponse = await fetch(commentUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (commentResponse.ok) {
          const data = await commentResponse.json();
          setCommentData(data);
        } else {
          const contentType = commentResponse.headers.get("content-type");
          let errorText = "";
          
          try {
            errorText = await commentResponse.text();
            
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = JSON.parse(errorText);
              } catch (e) {
                // Not JSON - có thể là HTML error page
              }
            }
          } catch (e) {
            // Error reading comment response
          }
          
          // Nếu route không tồn tại (404), thử dùng API getReportWithContent đã có
          if (commentResponse.status === 404) {
            // Comment route 404, but we should have gotten content from getReportWithContent
          } else {
            // Set commentData to null để hiển thị error state
            setCommentData(null);
          }
        }
      } else if (report.reportedType === "video") {
        // Fetch video data - sử dụng route /api/videos/:videoId (KHÔNG phải /api/admin/videos)
        const videoUrl = `${API_BASE_URL}/videos/${report.reportedId}`;
        
        const videoResponse = await fetch(videoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (videoResponse.ok) {
          const data = await videoResponse.json();
          setVideoData(data);
        } else {
          const contentType = videoResponse.headers.get("content-type");
          let errorText = "";
          
          try {
            errorText = await videoResponse.text();
            
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = JSON.parse(errorText);
              } catch (e) {
                // Non-JSON error response
              }
            }
          } catch (e) {
            // Error reading video response
          }
          
          // Set videoData to null để hiển thị error state
          setVideoData(null);
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
        }
      }
    } catch (error) {
      // Error fetching reported content
    } finally {
      setIsLoadingContent(false);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      if (!token) {
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
        setReport(data);
        
        // Reset tất cả content data trước khi set mới
        setCommentData(null);
        setVideoData(null);
        setUserData(null);
        
        // Set content data từ reportedContent nếu có - CHỈ set đúng loại tương ứng
        if (data.reportedContent) {
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
          // Set isLoadingContent = true để hiển thị loading khi fetch riêng
          setIsLoadingContent(true);
        }
      } else {
        // Fallback: Nếu API with-content không hoạt động, dùng API thông thường
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
          Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !reportId || !report) {
      Alert.alert("Lỗi", "Không có token, report ID hoặc report data");
      return;
    }

    try {
      setIsUpdating(newStatus); // Set which action is updating

      // 1. Cập nhật report status
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật trạng thái report");
      }

      const updatedReport = await response.json();
      setReport(updatedReport.report);

      // 2. Nếu resolve report (chấp nhận báo cáo), đánh dấu vi phạm cho đúng loại được report
      if (newStatus === "resolved") {
        // CHỈ xử lý đúng loại được report, không xử lý cả 2
        if (report.reportedType === "comment") {
          // Xử lý comment: đánh dấu comment vi phạm (ẩn comment)
          try {
            const commentStatusResponse = await fetch(
              `${API_BASE_URL}/admin/comments/${report.reportedId}/status`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "violation",
                }),
              }
            );

            if (commentStatusResponse.ok) {
              const contentType = commentStatusResponse.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                try {
                  const commentData = await commentStatusResponse.json();
                  // Cập nhật commentData trong state để hiển thị trạng thái vi phạm
                  if (commentData.comment) {
                    setCommentData({
                      ...commentData.comment,
                      status: "violation",
                    });
                  }
                } catch (parseError) {
                  // Failed to parse JSON response
                }
              } else {
                const textResponse = await commentStatusResponse.text();
              }
            } else {
              // Xử lý error response
              const contentType = commentStatusResponse.headers.get("content-type");
              let errorMessage = "Không thể đánh dấu comment vi phạm";
              
              try {
                if (contentType && contentType.includes("application/json")) {
                  const errorData = await commentStatusResponse.json();
                  errorMessage = errorData.message || errorMessage;
                } else {
                  // Server trả về HTML (404 page) hoặc text
                  const textResponse = await commentStatusResponse.text();
                  if (commentStatusResponse.status === 404) {
                    errorMessage = "API không tìm thấy route hoặc comment không tồn tại";
                  }
                }
              } catch (e) {
                // Error reading error response
              }
              // Không throw error, vì report đã được resolve thành công
            }
          } catch (error: any) {
            // Error marking comment as violation
            // Không throw error, vì report đã được resolve thành công
          }
        } else if (report.reportedType === "video") {
          // Xử lý video: đánh dấu video vi phạm
          try {
            const videoStatusResponse = await fetch(
              `${API_BASE_URL}/admin/videos/${report.reportedId}/status`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "violation",
                }),
              }
            );

            if (videoStatusResponse.ok) {
              const videoStatusData = await videoStatusResponse.json();
              // Cập nhật videoData trong state
              if (videoStatusData.video) {
                setVideoData({
                  ...videoStatusData.video,
                  status: "violation",
                });
              }
            } else {
              const errorData = await videoStatusResponse.json();
              // Không throw error, vì report đã được resolve thành công
            }
          } catch (error: any) {
            // Error marking video as violation
            // Không throw error, vì report đã được resolve thành công
          }
        } else if (report.reportedType === "user") {
          // Xử lý user: có thể khóa tài khoản hoặc cập nhật status
          // TODO: Implement user status update if needed
        }

        Alert.alert(
          "Thành công",
          `Đã xử lý báo cáo và đánh dấu ${report.reportedType === "comment" ? "comment" : report.reportedType === "video" ? "video" : "người dùng"} vi phạm`
        );
      } else {
        // Reject report: chỉ cập nhật report status, không đánh dấu vi phạm
        Alert.alert("Thành công", `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setIsUpdating(null); // Reset updating state
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
            onPress={() => {
              // Dừng video và tắt tiếng trước khi quay lại
              try {
                if (videoPlayer) {
                  videoPlayer.pause();
                  videoPlayer.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
                }
              } catch (error) {
                console.log("[Report Detail] Video player already released, skipping pause");
              }
              router.replace("/(admin)/reports");
            }}
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
                  <View style={styles.videoThumbnailContainer}>
                    {videoUrl ? (
                      <>
                        <VideoView
                          player={videoPlayer}
                          style={styles.videoThumbnail}
                          contentFit="cover"
                          nativeControls={false}
                          allowsFullscreen={false}
                        />
                        {videoData.status === "violation" && (
                          <View style={styles.videoThumbnailOverlay}>
                            <Ionicons name="warning" size={24} color={Colors.white} />
                            <Text style={styles.videoThumbnailOverlayText}>Vi phạm</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.videoThumbnailPlaceholder}>
                        <Ionicons name="videocam-outline" size={48} color={Colors.gray[400]} />
                        <Text style={styles.videoThumbnailPlaceholderText}>Không có video</Text>
                      </View>
                    )}
                  </View>
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
                <Text style={styles.noContentText}>Không thể tải thông tin video và video vi phạm đã bị xóa</Text>
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
                disabled={isUpdating !== null}
                activeOpacity={0.7}
              >
                {isUpdating === "resolved" ? (
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
                disabled={isUpdating !== null}
                activeOpacity={0.7}
              >
                {isUpdating === "rejected" ? (
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

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.gray,
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
  videoThumbnailContainer: {
    width: "100%",
    marginBottom: Spacing.md,
    position: "relative",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.error + "30",
  },
  videoThumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.md,
  },
  videoThumbnailPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  videoThumbnailPlaceholderText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoThumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  videoThumbnailOverlayText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
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
};

