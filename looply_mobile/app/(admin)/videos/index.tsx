import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatNumber, getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

type FilterType = "all" | "active" | "violation";

export default function AdminVideosScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { token } = useUser();
  const Colors = useColors(); // Get theme-aware colors
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]); // Lưu tất cả videos để filter
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

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
        setAllVideos(videoList); // Lưu tất cả videos
        applyFilter(videoList, filter); // Áp dụng filter hiện tại
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
        setAllVideos([]);
        setVideos([]);
      }
    } catch (error) {
      console.error("[Admin Videos] Error fetching videos:", error);
      setAllVideos([]);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm filter videos theo status
  const applyFilter = (videoList: Video[], currentFilter: FilterType) => {
    let filtered: Video[] = [];
    
    switch (currentFilter) {
      case "active":
        filtered = videoList.filter(v => v.status !== "violation");
        break;
      case "violation":
        filtered = videoList.filter(v => v.status === "violation");
        break;
      case "all":
      default:
        filtered = videoList;
        break;
    }
    
    setVideos(filtered);
  };

  // Khi filter thay đổi, áp dụng filter mới
  useEffect(() => {
    if (allVideos.length > 0) {
      applyFilter(allVideos, filter);
    }
  }, [filter]);

  // Tính toán thống kê
  const stats = {
    total: allVideos.length,
    active: allVideos.filter(v => v.status !== "violation").length,
    violation: allVideos.filter(v => v.status === "violation").length,
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info Card */}
        <View style={styles.adminCard}>
          <View style={styles.adminCardContent}>
            <Image
              source={getAvatarUri(user?.avatar)}
              style={styles.avatar}
            />
            <View style={styles.adminTextContainer}>
              <Text style={styles.adminName}>{user?.name || user?.username || "Admin"}</Text>
              {user?.email && (
                <Text style={styles.adminEmail}>{user.email}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Videos Section */}
        <View style={styles.videosCard}>
          <View style={styles.videosCardContent}>
          <View style={styles.videosHeader}>
            <Text style={styles.videosTitle}>Quản lý Video</Text>
            {/* Stats */}
            {!isLoading && allVideos.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Tổng</Text>
                </View>
                <View style={[styles.statItem, styles.statActive]}>
                  <Text style={[styles.statValue, styles.statValueActive]}>{stats.active}</Text>
                  <Text style={styles.statLabel}>Hoạt động</Text>
                </View>
                <View style={[styles.statItem, styles.statViolation]}>
                  <Text style={[styles.statValue, styles.statValueViolation]}>{stats.violation}</Text>
                  <Text style={styles.statLabel}>Vi phạm</Text>
                </View>
              </View>
            )}
          </View>

          {/* Filter Tabs */}
          {!isLoading && allVideos.length > 0 && (
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
                onPress={() => setFilter("all")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
                  Tất cả ({stats.total})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filter === "active" && styles.filterTabActive]}
                onPress={() => setFilter("active")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, filter === "active" && styles.filterTextActive]}>
                  Hoạt động ({stats.active})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filter === "violation" && styles.filterTabActive]}
                onPress={() => setFilter("violation")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, filter === "violation" && styles.filterTextActive]}>
                  Vi phạm ({stats.violation})
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : videos.length > 0 ? (
            <View style={styles.videosList}>
              {videos.map((item) => (
                <View 
                  key={item._id} 
                  style={[
                    styles.videoItem,
                    item.status === "violation" && styles.videoItemViolation
                  ]}
                >
                  <View style={styles.videoThumbnail}>
                    <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnailImage} />
                    {item.status === "violation" && (
                      <View style={styles.violationOverlay}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                      </View>
                    )}
                  </View>
                  <View style={styles.videoInfo}>
                    <View style={styles.videoTitleRow}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {item.title || "Untitled Video"}
                      </Text>
                      {item.status === "violation" && (
                        <View style={styles.violationBadge}>
                          <Ionicons name="warning" size={12} color="#EF4444" />
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
              <Ionicons name="videocam-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>
                {filter === "all" 
                  ? "Không có video nào" 
                  : filter === "active" 
                    ? "Không có video hoạt động nào"
                    : "Không có video vi phạm nào"}
              </Text>
            </View>
          )}
          </View>
        </View>
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
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.md,
    paddingHorizontal: 0,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[200],
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  adminCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  adminTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    flexShrink: 1,
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
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  videosCardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  videosHeader: {
    marginBottom: Spacing.md,
  },
  videosTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    width: "100%",
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 0,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statActive: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success + "30",
  },
  statViolation: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error + "30",
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  statValueActive: {
    color: Colors.success,
  },
  statValueViolation: {
    color: Colors.error,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  filterTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  videosList: {
    gap: Spacing.sm,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  videoItemViolation: {
    backgroundColor: Colors.error + "10",
    borderColor: Colors.error + "40",
  },
  videoThumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  violationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    minWidth: 0,
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
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoActions: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexShrink: 0,
  },
  viewButton: {
    backgroundColor: "#D1D1D1",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 50,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  violationButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
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
};

