import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber, getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  url?: string;
  views?: number;
  user: {
    name: string;
    _id: string;
    avatar?: string;
  };
  createdAt: string;
  status?: string;
}

export default function AdminVideosScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { token } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchVideos();
    }
  }, [token]);

  // Refresh khi quay lại từ video-detail
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchVideos();
      }
    }, [token])
  );

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      if (!token) {
        console.warn("No token available");
        return;
      }

      // Thử fetch từ admin route trước
      let url = `${API_BASE_URL}/admin/videos`;
      console.log(`[Admin Videos] Fetching from: ${url}`);
      
      let response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log(`[Admin Videos] Response status: ${response.status}`);
      
      // Fallback: Nếu admin route trả về 404, dùng route videos thông thường
      if (response.status === 404) {
        console.warn("⚠️ Admin videos route not found, using fallback: /api/videos");
        url = `${API_BASE_URL}/videos`;
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log(`[Admin Videos] Fallback response status: ${response.status}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Admin Videos] Data received:`, data);
        // API trả về { total, page, limit, videos: [...] } hoặc array trực tiếp
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        console.log(`[Admin Videos] Video list length: ${videoList.length}`);
        setVideos(videoList);
      } else {
        const contentType = response.headers.get("content-type");
        let errorText = "";
        
        try {
          errorText = await response.text();
          console.error(`[Admin Videos] Failed to fetch videos: ${response.status}`, errorText);
          
          // Try to parse error message if it's JSON
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = JSON.parse(errorText);
              console.error(`[Admin Videos] Error details:`, errorData);
            } catch (e) {
              // Not JSON, just log the text
            }
          }
        } catch (e) {
          console.error("[Admin Videos] Error reading response:", e);
        }
        
        // Set empty array nếu không fetch được
        setVideos([]);
      }
    } catch (error) {
      console.error("[Admin Videos] Error fetching videos:", error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVideo = (video: Video) => {
    // Chỉ pass videoId, để video-detail tự fetch data từ API để đảm bảo data mới nhất
    router.push({
      pathname: "/(admin)/videos/video-detail",
      params: {
        videoId: video._id,
        // Pass thêm params để fallback nếu API fail
        videoUrl: video.url || video.thumbnail || "",
        title: video.title || "Untitled Video",
        author: video.user?.name || "Unknown",
        views: String(video.views || 0),
        authorId: video.user?._id || "",
      },
    });
  };

  const handleViolation = (video: Video) => {
    // Navigate to video detail for violation reporting
    // Video detail sẽ có button "Vi phạm" để báo cáo
    handleViewVideo(video);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info Card */}
        <View style={styles.adminCard}>
          <Image
            source={getAvatarUri(user?.avatar)}
            style={styles.avatar}
          />
          <View style={styles.adminTextContainer}>
            <Text style={styles.adminName}>{user?.name || user?.username || "Admin"}</Text>
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
            {user?.email && (
              <Text style={styles.adminEmail}>{user.email}</Text>
            )}
          </View>
        </View>

        {/* Videos Section */}
        <View style={styles.videosCard}>
          <Text style={styles.videosTitle}>Video gần đây</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : videos.length > 0 ? (
            <View style={styles.videosList}>
              {videos.map((item) => (
                <View key={item._id} style={styles.videoItem}>
                  <View style={styles.videoThumbnail}>
                    <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnailImage} />
                  </View>
                  <View style={styles.videoInfo}>
                    <View style={styles.videoTitleRow}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {item.title || "Untitled Video"}
                      </Text>
                      {item.status === "violation" && (
                        <View style={styles.violationBadge}>
                          <Text style={styles.violationBadgeText}>Vi phạm</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.videoMeta}>
                      {item.user?.name || "Unknown"} • {formatNumber(item.views || 0)} lượt xem
                    </Text>
                  </View>
                  <View style={styles.videoActions}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => handleViewVideo(item)}
                    >
                      <Text style={styles.viewButtonText}>Xem</Text>
                    </TouchableOpacity>
                    {item.status !== "violation" && (
                      <TouchableOpacity 
                        style={styles.violationButton}
                        onPress={() => handleViolation(item)}
                      >
                        <Text style={styles.violationButtonText}>Vi phạm</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có video nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray[200],
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  adminEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  videosCard: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  videosTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  videosList: {
    gap: Spacing.sm,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  videoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  videoTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  violationBadge: {
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
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  viewButton: {
    backgroundColor: "#D1D1D1",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  violationButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  violationButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoThumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
});

