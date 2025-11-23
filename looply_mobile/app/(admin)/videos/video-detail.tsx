import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VIOLATION_REASONS = [
  "Nội dung bản quyền",
  "Nội dung không phù hợp",
  "Spam hoặc lừa đảo",
  "Bạo lực hoặc quấy rối",
  "Nội dung khiêu dâm",
  "Thông tin sai lệch",
  "Khác",
];

export default function AdminVideoDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useCurrentUser();
  const { token } = useUser();
  
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [violationDetails, setViolationDetails] = useState<string>("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);

  // Get video ID and comment ID from params
  const videoId = (Array.isArray(params.videoId) ? params.videoId[0] : params.videoId) || "";
  const commentId = (Array.isArray(params.commentId) ? params.commentId[0] : params.commentId) || "";
  const highlightComment = (Array.isArray(params.highlightComment) ? params.highlightComment[0] : params.highlightComment) === "true";
  const [commentData, setCommentData] = useState<any>(null);

  // Fetch video data from API
  useEffect(() => {
    if (videoId && token) {
      fetchVideoData();
    }
  }, [videoId, token]);

  // Fetch comment data if commentId exists
  useEffect(() => {
    if (commentId && token && highlightComment) {
      fetchCommentData();
    }
  }, [commentId, token, highlightComment]);

  const fetchCommentData = async () => {
    try {
      if (!token || !commentId) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/comments/id/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Video Detail] Comment data fetched:", data);
        setCommentData(data);
      } else {
        console.error("[Video Detail] Failed to fetch comment:", response.status);
      }
    } catch (error) {
      console.error("[Video Detail] Error fetching comment:", error);
    }
  };

  const fetchVideoData = async () => {
    try {
      setIsLoadingVideo(true);
      if (!token || !videoId) {
        console.warn("[Video Detail] Missing token or videoId");
        return;
      }

      const videoUrl = `${API_BASE_URL}/admin/videos/${videoId}`;
      console.log("[Video Detail] 📹 Fetching video from:", videoUrl);
      console.log("[Video Detail] Video ID:", videoId);
      
      const response = await fetch(videoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Video Detail] ✅ Video data fetched:", data);
        setVideoData(data);
      } else {
        // Xử lý lỗi một cách graceful
        const contentType = response.headers.get("content-type");
        let errorText = "";
        
        try {
          errorText = await response.text();
          
          // Nếu là 404, chỉ log warning (chỉ khi chưa có videoData)
          if (response.status === 404) {
            if (!videoData) {
              console.warn(`[Video Detail] ⚠️ Video API not available (404). Using fallback data.`);
              console.warn(`[Video Detail] ⚠️ URL: ${videoUrl}`);
            } else {
              // Đã có videoData, chỉ log info để tránh spam warning
              console.log(`[Video Detail] ℹ️ Video API not available (404), keeping existing videoData`);
            }
          } else {
            // Các lỗi khác vẫn log error
            console.error(`[Video Detail] ❌ Error response (${response.status}):`, errorText.substring(0, 200));
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = JSON.parse(errorText);
                console.error("[Video Detail] ❌ Error data:", errorData);
              } catch (e) {
                // Ignore parse error
              }
            }
          }
        } catch (e) {
          console.warn("[Video Detail] ⚠️ Failed to read error response");
        }
        
        // Chỉ dùng fallback data nếu chưa có videoData (lần đầu load)
        // Nếu đã có videoData từ lần fetch trước, giữ nguyên để tránh tạo "video ảo"
        if (!videoData) {
          console.log("[Video Detail] 📦 No existing videoData, using fallback from params");
          const fallbackData = {
            _id: videoId,
            url: (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "",
            thumbnail: (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "",
            title: (Array.isArray(params.title) ? params.title[0] : params.title) || "Untitled Video",
            user: {
              name: (Array.isArray(params.author) ? params.author[0] : params.author) || "Unknown",
              _id: (Array.isArray(params.authorId) ? params.authorId[0] : params.authorId) || "",
            },
            views: parseInt((Array.isArray(params.views) ? params.views[0] : params.views) || "0"),
          };
          setVideoData(fallbackData);
        } else {
          // Đã có videoData, giữ nguyên để đảm bảo data chính xác từ danh sách videos
          console.log("[Video Detail] ℹ️ Keeping existing videoData (from videos list) to ensure data accuracy");
        }
      }
    } catch (error: any) {
      // Xử lý lỗi network hoặc các lỗi khác một cách graceful
      console.warn("[Video Detail] ⚠️ Error fetching video (network or other error):", error.message);
      
      // Chỉ dùng fallback data nếu chưa có videoData (lần đầu load)
      // Nếu đã có videoData, giữ nguyên để tránh tạo "video ảo"
      if (!videoData) {
        console.warn("[Video Detail] ⚠️ No existing videoData, using fallback from params");
        const fallbackData = {
          _id: videoId,
          url: (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "",
          thumbnail: (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "",
          title: (Array.isArray(params.title) ? params.title[0] : params.title) || "Untitled Video",
          user: {
            name: (Array.isArray(params.author) ? params.author[0] : params.author) || "Unknown",
            _id: (Array.isArray(params.authorId) ? params.authorId[0] : params.authorId) || "",
          },
          views: parseInt((Array.isArray(params.views) ? params.views[0] : params.views) || "0"),
        };
        setVideoData(fallbackData);
      } else {
        console.log("[Video Detail] ℹ️ Keeping existing videoData to avoid creating fake video");
      }
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Get video data from state or params (fallback)
  const videoUrl = videoData?.url || videoData?.thumbnail || (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const title = videoData?.title || (Array.isArray(params.title) ? params.title[0] : params.title) || "Hướng dẫn nấu phở";
  const author = videoData?.user?.name || (Array.isArray(params.author) ? params.author[0] : params.author) || "anhHai";
  const views = videoData?.views || parseInt((Array.isArray(params.views) ? params.views[0] : params.views) || "1245");

  // Update player when videoUrl changes
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.muted = false; // Cho phép có âm thanh khi đang xem
    player.play();
  });

  // Update player source when videoData changes
  useEffect(() => {
    if (videoData?.url && player) {
      player.replace(videoData.url);
    }
  }, [videoData?.url]);

  // Dừng video khi màn hình mất focus (navigate away)
  useFocusEffect(
    React.useCallback(() => {
      // Khi màn hình được focus, không làm gì (video đã đang phát)
      return () => {
        // Khi màn hình mất focus (navigate away), dừng video
        try {
          if (player) {
            player.pause();
            player.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
          }
        } catch (error) {
          console.log("[Video Detail] Player already released, skipping pause");
        }
      };
    }, [player])
  );

  // Dừng video khi component unmount
  useEffect(() => {
    return () => {
      try {
        if (player) {
          player.pause();
          player.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
        }
      } catch (error) {
        console.log("[Video Detail] Player already released, skipping pause");
      }
    };
  }, [player]);

  const handleSkip = () => {
    // Dừng video và tắt tiếng trước khi quay lại
    try {
      if (player) {
        player.pause();
        player.muted = true; // Tắt tiếng để đảm bảo không còn âm thanh
      }
    } catch (error) {
      console.log("[Video Detail] Player already released, skipping pause");
    }
    // Bỏ qua video này, quay lại danh sách
    // Danh sách sẽ tự refresh khi quay lại (useFocusEffect)
    router.back();
  };

  const handleViolation = () => {
    setShowViolationModal(true);
  };

  const handleApprove = async () => {
    if (!token || !videoId) {
      Alert.alert("Lỗi", "Không có token xác thực hoặc video ID");
      return;
    }

    try {
      const statusUrl = `${API_BASE_URL}/admin/videos/${videoId}/status`;
      const statusBody = { 
        status: "active",
        moderationStatus: "approved"
      };
      
      console.log("[Approve Video] 🎬 Updating video status...");
      console.log("[Approve Video] URL:", statusUrl);
      console.log("[Approve Video] Body:", statusBody);
      
      const response = await fetch(statusUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Approve Video] ✅ Video approved:", data);
        
        // Cập nhật status vào videoData ngay lập tức
        if (videoData) {
          setVideoData({
            ...videoData,
            status: "active",
            moderationStatus: "approved",
          });
        }
        
        // Refresh video data từ server
        try {
          await fetchVideoData();
        } catch (error) {
          console.warn("[Approve Video] ⚠️ Failed to refresh from server, but status already updated in local state");
        }
        
        Alert.alert("Thành công", "Video đã được đánh dấu là hợp lệ và sẽ hiển thị cho tất cả người dùng.", [
          {
            text: "OK",
            onPress: () => {
              // Quay lại danh sách videos
              router.back();
            },
          },
        ]);
      } else {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Không thể cập nhật trạng thái video";
        
        try {
          const responseText = await response.text();
          console.error(`[Approve Video] ❌ Error response (${response.status}):`, responseText);
          
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Lỗi ${response.status}: ${responseText.substring(0, 100)}`;
            }
          } else {
            errorMessage = `Lỗi ${response.status}: ${responseText.substring(0, 100)}`;
          }
        } catch (e) {
          errorMessage = `Lỗi ${response.status}: Không thể cập nhật trạng thái video`;
        }
        
        Alert.alert("Lỗi", errorMessage);
      }
    } catch (error: any) {
      console.error("[Approve Video] ❌ Error:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái video. Vui lòng thử lại.");
    }
  };

  const handleCloseModal = () => {
    setShowViolationModal(false);
    setSelectedReason("");
    setViolationDetails("");
    setShowReasonDropdown(false);
  };

  const handleConfirmViolation = async () => {
    if (!selectedReason) {
      Alert.alert("Thông báo", "Vui lòng chọn lý do vi phạm");
      return;
    }

    if (!violationDetails.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập chi tiết vi phạm");
      return;
    }

    if (!token) {
      Alert.alert("Lỗi", "Không có token xác thực");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Tạo report
      const reportReason = `${selectedReason}\n\nChi tiết: ${violationDetails}`;
      const reportUrl = `${API_BASE_URL}/reports`;
      const reportBody = {
        reportedType: "video",
        reportedId: videoId,
        reason: reportReason,
      };
      
      console.log("[Violation] 📝 Creating report...");
      console.log("[Violation] URL:", reportUrl);
      console.log("[Violation] Body:", reportBody);
      
      const reportResponse = await fetch(reportUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportBody),
      });

      console.log("[Violation] Report response status:", reportResponse.status);
      console.log("[Violation] Report response ok:", reportResponse.ok);

      if (!reportResponse.ok) {
        const contentType = reportResponse.headers.get("content-type");
        let errorMessage = "Không thể tạo báo cáo";
        let responseText = "";
        
        // Response body chỉ có thể đọc một lần, nên cần clone hoặc đọc text trước
        try {
          responseText = await reportResponse.text();
          console.error(`[Violation] ❌ Error response (${reportResponse.status}):`, responseText);
          
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
              console.error("[Violation] ❌ Error data:", errorData);
            } catch (e) {
              // Nếu không parse được JSON, dùng text hoặc status code
              console.error("[Violation] ❌ Failed to parse JSON error:", e);
              if (reportResponse.status === 404) {
                errorMessage = `API không tìm thấy (404). URL: ${reportUrl}`;
              } else {
                errorMessage = `Lỗi ${reportResponse.status}: ${responseText.substring(0, 100)}`;
              }
            }
          } else {
            // Server trả về HTML (404 page) hoặc text
            console.error("[Violation] ❌ Non-JSON response:", responseText.substring(0, 200));
            if (reportResponse.status === 404) {
              errorMessage = `API không tìm thấy (404). URL: ${reportUrl}. Response: ${responseText.substring(0, 100)}`;
            } else {
              errorMessage = `Lỗi ${reportResponse.status}: ${responseText.substring(0, 100)}`;
            }
          }
        } catch (e) {
          // Nếu không đọc được response, dùng status code
          console.error("[Violation] ❌ Failed to read response:", e);
          if (reportResponse.status === 404) {
            errorMessage = `API không tìm thấy (404). URL: ${reportUrl}`;
          } else {
            errorMessage = `Lỗi ${reportResponse.status}: Không thể tạo báo cáo`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const reportData = await reportResponse.json();
      console.log("[Violation] ✅ Report created:", reportData);

      // 2. Cập nhật video status thành "violation"
      const statusUrl = `${API_BASE_URL}/admin/videos/${videoId}/status`;
      const statusBody = { status: "violation" };
      
      console.log("[Violation] 🎬 Updating video status...");
      console.log("[Violation] URL:", statusUrl);
      console.log("[Violation] Body:", statusBody);
      
      let statusUpdateSuccess = false;
      try {
        const statusResponse = await fetch(statusUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(statusBody),
        });

        console.log("[Violation] Status response:", statusResponse.status);
        console.log("[Violation] Status response ok:", statusResponse.ok);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log("[Violation] ✅ Video status updated:", statusData);
          statusUpdateSuccess = true;
        } else {
          // Nếu API không tồn tại (404), chỉ log warning và tiếp tục
          if (statusResponse.status === 404) {
            console.warn("[Violation] ⚠️ Update status API not available (404). Report was created successfully.");
            console.warn("[Violation] ⚠️ This is expected if server hasn't deployed the route yet.");
            // Không throw error, chỉ báo cáo đã tạo thành công
            statusUpdateSuccess = false;
          } else {
            // Các lỗi khác (500, 403, etc.) vẫn throw error
            const contentType = statusResponse.headers.get("content-type");
            let errorMessage = "Không thể cập nhật trạng thái video";
            let responseText = "";
            
            try {
              responseText = await statusResponse.text();
              console.error(`[Violation] ❌ Status error response (${statusResponse.status}):`, responseText);
              
              if (contentType && contentType.includes("application/json")) {
                try {
                  const errorData = JSON.parse(responseText);
                  errorMessage = errorData.message || errorMessage;
                } catch (e) {
                  errorMessage = `Lỗi ${statusResponse.status}: ${responseText.substring(0, 100)}`;
                }
              } else {
                errorMessage = `Lỗi ${statusResponse.status}: ${responseText.substring(0, 100)}`;
              }
            } catch (e) {
              errorMessage = `Lỗi ${statusResponse.status}: Không thể cập nhật trạng thái video`;
            }
            throw new Error(errorMessage);
          }
        }
      } catch (error: any) {
        // Nếu lỗi không phải 404, throw error
        if (error.message && !error.message.includes("404")) {
          throw error;
        }
        // Nếu là 404, chỉ log và tiếp tục
        console.warn("[Violation] ⚠️ Status update failed but report was created:", error.message);
      }

      // Cập nhật status vào videoData ngay lập tức nếu update thành công
      // Để UI hiển thị đúng trạng thái mới ngay, không cần đợi fetchVideoData
      if (statusUpdateSuccess && videoData) {
        setVideoData({
          ...videoData,
          status: "violation",
        });
        console.log("[Violation] ✅ Updated video status to 'violation' in local state immediately");
      }
      
      // Refresh video data từ server để đảm bảo sync (nếu API available)
      // Nhưng không bắt buộc, vì đã cập nhật status vào state rồi
      if (statusUpdateSuccess) {
        try {
          await fetchVideoData();
        } catch (error) {
          console.warn("[Violation] ⚠️ Failed to refresh from server, but status already updated in local state");
          // Không cần làm gì, vì đã cập nhật status vào state rồi
        }
      }
      
      // Hiển thị thông báo thành công
      const successMessage = statusUpdateSuccess 
        ? "Đã báo cáo vi phạm thành công. Video này sẽ bị ẩn khỏi tất cả người dùng."
        : "Đã báo cáo vi phạm thành công. Trạng thái video sẽ được cập nhật sau.";
      
      Alert.alert("Thành công", successMessage, [
        {
          text: "OK",
          onPress: () => {
            handleCloseModal();
            // Quay lại danh sách videos, danh sách sẽ tự refresh (useFocusEffect)
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error reporting violation:", error);
      Alert.alert("Lỗi", error.message || "Không thể báo cáo vi phạm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingVideo) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Background Video/Image */}
      <View style={styles.backgroundContainer}>
        <VideoView
          player={player}
          style={styles.backgroundVideo}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Fallback background image if video fails */}
        <View style={styles.backgroundOverlay} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.adminInfo}>
            <Image
              source={getAvatarUri(user?.avatar)}
              style={styles.avatar}
            />
            <View style={styles.adminTextContainer}>
              <Text style={styles.adminName}>{user?.name || user?.username || "Admin"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Comment Report Alert - Hiển thị nếu có comment được báo cáo */}
      {commentData && highlightComment && (
        <View style={styles.commentAlertCard}>
          <View style={styles.commentAlertHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#F59E0B" />
            <Text style={styles.commentAlertTitle}>Comment được báo cáo</Text>
          </View>
          <Text style={styles.commentAlertText} numberOfLines={3}>
            {commentData.text}
          </Text>
          {commentData.userId && (
            <Text style={styles.commentAlertUser}>
              - {commentData.userId.name || commentData.userId.username || "Unknown"}
            </Text>
          )}
          <TouchableOpacity
            style={styles.viewCommentButton}
            onPress={() => {
              // Navigate đến comments screen với commentId để highlight
              router.push({
                pathname: "/(tabs)/home/comments",
                params: {
                  videoId: videoId,
                  commentId: commentId,
                  highlightComment: "true",
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewCommentButtonText}>Xem comment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Info Card */}
      <View style={styles.videoCard}>
        <View style={styles.videoCardContent}>
        <View style={styles.videoInfo}>
          <View style={styles.videoTitleRow}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {title}
            </Text>
            {videoData?.status === "violation" && (
              <View style={styles.violationBadge}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.violationBadgeText}>Vi phạm</Text>
              </View>
            )}
          </View>
          <Text style={styles.videoMeta}>
            {author} • {formatNumber(views)} lượt xem
          </Text>
        </View>
        <View style={styles.videoActions}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
          {videoData?.status === "violation" ? (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={handleApprove}
              activeOpacity={0.7}
            >
              <Text style={styles.approveButtonText}>Hợp lệ</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.violationButton}
              onPress={handleViolation}
              activeOpacity={0.7}
            >
              <Text style={styles.violationButtonText}>Vi phạm</Text>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </View>

      {/* Violation Report Modal */}
      <Modal
        visible={showViolationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lý do vi phạm:</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Reason Dropdown */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedReason && styles.dropdownPlaceholder,
                  ]}
                >
                  {selectedReason || "-----Vui lòng chọn -----"}
                </Text>
                <Ionicons
                  name={showReasonDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>

              {showReasonDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScroll}>
                    {VIOLATION_REASONS.map((reason) => (
                      <TouchableOpacity
                        key={reason}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedReason(reason);
                          setShowReasonDropdown(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>{reason}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Violation Details */}
            <Text style={styles.detailsLabel}>Chi tiết vi phạm:</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Nhập chi tiết vi phạm..."
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={6}
              value={violationDetails}
              onChangeText={setViolationDetails}
              textAlignVertical="top"
            />

            {/* Confirm Button */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                onPress={handleConfirmViolation}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundVideo: {
    width: "100%",
    height: "100%",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  adminInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[200],
    borderWidth: 2,
    borderColor: Colors.white,
  },
  adminTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  adminName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  adminRole: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontFamily: Typography.fontFamily.regular,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoCard: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: "#1E3A5F",
    borderRadius: 0,
    paddingVertical: Spacing.md,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  videoCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    width: "100%",
  },
  videoInfo: {
    flex: 1,
    marginRight: Spacing.md,
    minWidth: 0,
  },
  videoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  videoTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    flexShrink: 1,
  },
  violationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF444420",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  violationBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: "#EF4444",
    fontFamily: Typography.fontFamily.medium,
  },
  videoMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[300],
    fontFamily: Typography.fontFamily.regular,
  },
  videoActions: {
    gap: Spacing.xs,
  },
  skipButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  violationButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  violationButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  approveButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  approveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  dropdownContainer: {
    marginBottom: Spacing.md,
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dropdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.text.secondary,
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginTop: Spacing.xs,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  detailsLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },
  detailsInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.md,
  },
  modalActions: {
    alignItems: "flex-end",
  },
  confirmButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontFamily: Typography.fontFamily.regular,
  },
  commentAlertCard: {
    position: "absolute",
    bottom: 200,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: "#FEF3C7",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#F59E0B",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  commentAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  commentAlertTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: "#92400E",
    fontFamily: Typography.fontFamily.bold,
  },
  commentAlertText: {
    fontSize: Typography.fontSize.sm,
    color: "#78350F",
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
  },
  commentAlertUser: {
    fontSize: Typography.fontSize.xs,
    color: "#92400E",
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
  },
  viewCommentButton: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  viewCommentButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
});

