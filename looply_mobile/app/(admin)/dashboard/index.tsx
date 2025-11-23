import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatNumber, getAvatarUri, getThumbnailUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StatsData {
  total: {
    users: number;
    videos: number;
    reports: number;
  };
  today: {
    users: number;
    videos: number;
    reports: number;
  };
  users: {
    active: number;
    locked: number;
  };
  videos: {
    active: number;
    violation: number;
  };
  reports: {
    pending: number;
    resolved: number;
  };
}

interface RecentVideo {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

interface RecentReport {
  _id: string;
  reportedType: string;
  reportedId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { token } = useUser();
  const { user } = useCurrentUser();
  const Colors = useColors(); // Get theme-aware colors
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [recentVideoReports, setRecentVideoReports] = useState<RecentReport[]>([]);
  const [recentCommentReports, setRecentCommentReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Reload khi quay lại trang
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchDashboardData();
      }
    }, [token])
  );

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (token) {
      await fetchDashboardData(false); // Không hiển thị loading screen khi refresh
    }
    setRefreshing(false);
  }, [token]);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      if (!token) {
        // Set fallback data
        setStats({
          total: { users: 0, videos: 0, reports: 0 },
          today: { users: 0, videos: 0, reports: 0 },
          users: { active: 0, locked: 0 },
          videos: { active: 0, violation: 0 },
          reports: { pending: 0, resolved: 0 },
        });
        return;
      }
      
      // Fetch stats
      const statsUrl = `${API_BASE_URL}/admin/dashboard/stats`;
      const statsResponse = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        
        // Set fallback stats
        setStats({
          total: { users: 0, videos: 0, reports: 0 },
          today: { users: 0, videos: 0, reports: 0 },
          users: { active: 0, locked: 0 },
          videos: { active: 0, violation: 0 },
          reports: { pending: 0, resolved: 0 },
        });
      }

      // Fetch recent videos - mặc định hiển thị 3 video mới nhất
      // Thử route admin trước, nếu fail thì dùng route videos/latest làm fallback
      const videosUrl = `${API_BASE_URL}/videos/moderation/flagged-rejected?page=1&limit=3`;
      let videosResponse = await fetch(videosUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route videos/latest
      if (videosResponse.status === 404) {
        const errorText = await videosResponse.text();
        videosResponse = await fetch(`${API_BASE_URL}/videos/latest`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        let videosList = videosData.videos || videosData || [];
        
        // Nếu dùng fallback route, limit 3 videos
        if (Array.isArray(videosList) && videosList.length > 3) {
          videosList = videosList.slice(0, 3);
        }
        
        setRecentVideos(Array.isArray(videosList) ? videosList : []);
      } else {
        const errorText = await videosResponse.text();
        // Keep empty array, will show "Chưa có video nào"
        setRecentVideos([]);
      }

      // Fetch recent VIDEO reports - mặc định hiển thị 3 video reports mới nhất
      const videoReportsUrl = `${API_BASE_URL}/admin/dashboard/recent-reports?limit=3&type=video`;
      let videoReportsResponse = await fetch(videoReportsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route reports
      if (videoReportsResponse.status === 404) {
        videoReportsResponse = await fetch(`${API_BASE_URL}/reports?limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      if (videoReportsResponse.ok) {
        const reportsData = await videoReportsResponse.json();
        let reportsList = reportsData.reports || reportsData || [];
        
        // Nếu dùng fallback route, filter video reports và limit 3
        if (Array.isArray(reportsList)) {
          reportsList = reportsList
            .filter((report: RecentReport) => report.reportedType === "video")
            .slice(0, 3);
        }
        
        setRecentVideoReports(Array.isArray(reportsList) ? reportsList : []);
      } else {
        setRecentVideoReports([]);
      }

      // Fetch recent COMMENT reports - mặc định hiển thị 3 comment reports mới nhất
      const commentReportsUrl = `${API_BASE_URL}/admin/dashboard/recent-reports?limit=3&type=comment`;
      let commentReportsResponse = await fetch(commentReportsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route reports
      if (commentReportsResponse.status === 404) {
        commentReportsResponse = await fetch(`${API_BASE_URL}/reports?limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      if (commentReportsResponse.ok) {
        const reportsData = await commentReportsResponse.json();
        let reportsList = reportsData.reports || reportsData || [];
        
        // Nếu dùng fallback route, filter comment reports và limit 3
        if (Array.isArray(reportsList)) {
          reportsList = reportsList
            .filter((report: RecentReport) => report.reportedType === "comment")
            .slice(0, 3);
        }
        
        setRecentCommentReports(Array.isArray(reportsList) ? reportsList : []);
      } else {
        setRecentCommentReports([]);
      }
    } catch (error) {
      // Set fallback data on error
      setStats({
        total: { users: 0, videos: 0, reports: 0 },
        today: { users: 0, videos: 0, reports: 0 },
        users: { active: 0, locked: 0 },
        videos: { active: 0, violation: 0 },
        reports: { pending: 0, resolved: 0 },
      });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours === 1) return "1 giờ trước";
    return `${diffInHours} giờ trước`;
  };

  const getReportedTypeText = (type: string) => {
    switch (type) {
      case "user":
        return "người dùng";
      case "video":
        return "video";
      case "comment":
        return "comment";
      default:
        return type;
    }
  };

  const formatReportMeta = (report: RecentReport) => {
    const typeText = getReportedTypeText(report.reportedType);
    return `${typeText} - ${report.reason} - ${formatTimeAgo(report.createdAt)}`;
  };

  const formatReportId = (id: string) => {
    // Extract last 3 characters from ObjectId and convert to number
    const lastChars = id.slice(-3);
    const num = parseInt(lastChars, 16) % 1000;
    const displayNum = num < 100 ? num + 100 : num;
    return `#${displayNum.toString()}`;
  };

  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
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

        {/* Dashboard Content */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardCardContent}>
            {/* Quick Overview */}
          {stats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tổng quan nhanh</Text>
              <Text style={styles.sectionSubtitle}>Số liệu hệ thống hôm nay</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Người dùng</Text>
                  <Text style={styles.statValue}>{formatNumber(stats.total.users)}</Text>
                  <Text style={styles.statSubtext}>+{stats.today.users} hôm nay</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Video</Text>
                  <Text style={styles.statValue}>{formatNumber(stats.total.videos)}</Text>
                  <Text style={styles.statSubtext}>+{stats.today.videos} hôm nay</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Báo cáo</Text>
                  <Text style={styles.statValue}>{formatNumber(stats.total.reports)}</Text>
                  <Text style={styles.statSubtext}>+{stats.today.reports} hôm nay</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ad Management Card */}
          <TouchableOpacity 
            style={styles.section}
            onPress={() => router.push({ pathname: "/(admin)/ads" as any })}
            activeOpacity={0.7}
          >
            <View style={styles.adCardContent}>
              <Ionicons name="megaphone" size={24} color={Colors.primary} />
              <View style={styles.adCardText}>
                <Text style={styles.sectionTitle}>Quản lý quảng cáo</Text>
                <Text style={styles.sectionSubtitle}>Tạo và quản lý quảng cáo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Recent Videos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Video vi phạm</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/videos")}>
                <Text style={styles.viewAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {recentVideos.length > 0 ? (
              recentVideos.slice(0, 3).map((video) => (
                <View key={video._id} style={styles.videoItem}>
                  <View style={styles.videoThumbnail}>
                    {video.thumbnail ? (
                      <Image 
                        source={getThumbnailUri(video.thumbnail)} 
                        style={styles.videoThumbnailImage}
                        resizeMode="cover"
                        onError={() => {
                          // Failed to load thumbnail
                        }}
                      />
                    ) : (
                      <View style={styles.videoThumbnailPlaceholder}>
                        <Ionicons name="videocam-outline" size={24} color={Colors.gray[400]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={1} ellipsizeMode="tail">{video.title}</Text>
                    <Text style={styles.videoMeta} numberOfLines={1} ellipsizeMode="tail">
                      {video.user?.name || video.user?.username || "Unknown"} • {formatNumber(video.views || 0)} lượt xem
                    </Text>
                  </View>
                  <View style={styles.videoActions}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => router.push({
                        pathname: "/(admin)/videos/video-detail",
                        params: {
                          videoId: video._id,
                          videoUrl: video.thumbnail || "",
                          title: video.title,
                          author: video.user?.name || video.user?.username || "Unknown",
                          views: String(video.views || 0),
                        },
                      })}
                    >
                      <Text style={styles.viewButtonText}>Xem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.violationButton}
                      onPress={() => router.push({
                        pathname: "/(admin)/videos/video-detail",
                        params: {
                          videoId: video._id,
                          videoUrl: video.thumbnail || "",
                          title: video.title,
                          author: video.user?.name || video.user?.username || "Unknown",
                          views: String(video.views || 0),
                        },
                      })}
                    >
                      <Text style={styles.violationButtonText}>Vi phạm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có video nào</Text>
            )}
          </View>

          {/* Video Reports - Hiển thị tối đa 3 video reports mới nhất */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Báo cáo</Text>
              <TouchableOpacity 
                onPress={() => router.push("/(admin)/reports")}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {recentVideoReports.length > 0 ? (
              recentVideoReports.map((report) => (
                <TouchableOpacity
                  key={report._id}
                  style={styles.reportItem}
                  onPress={() => router.push({
                    pathname: "/(admin)/reports/report-detail",
                    params: {
                      reportId: report._id,
                    },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportThumbnail}>
                    <Ionicons 
                      name="flag" 
                      size={24} 
                      color={
                        report.status === "resolved" ? "#10B981" :
                        report.status === "rejected" ? "#EF4444" :
                        "#F59E0B"
                      } 
                    />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportId}>
                      {`Báo cáo ${formatReportId(report._id)}`}
                    </Text>
                    <Text style={styles.reportMeta} numberOfLines={2}>
                      {formatReportMeta(report)}
                    </Text>
                    <View style={styles.reportStatusBadge}>
                      <Text style={[
                        styles.reportStatusText,
                        { color: 
                          report.status === "resolved" ? "#10B981" :
                          report.status === "rejected" ? "#EF4444" :
                          "#F59E0B"
                        }
                      ]}>
                        {report.status === "resolved" ? "Đã xử lý" :
                         report.status === "rejected" ? "Đã từ chối" :
                         "Đang chờ"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={Colors.text.secondary} 
                    style={{ marginLeft: Spacing.xs }}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyReportContainer}>
                <Ionicons name="videocam-outline" size={48} color={Colors.gray[400]} />
                <Text style={styles.emptyText}>Chưa có báo cáo video nào</Text>
              </View>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 0, 
    marginTop: 0, 
    marginBottom: Spacing.md,
    borderRadius: 0, 
    paddingVertical: Spacing.lg, 
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  adminCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[200],
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  adminTextContainer: {
    flex: 1,
    minWidth: 0, // Đảm bảo flex shrink hoạt động
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    flexShrink: 1, // Cho phép text co lại nếu cần
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
  dashboardCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  dashboardCardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
  },
  dashboardTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 0,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginVertical: Spacing.xs,
  },
  statSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  viewAllLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    textDecorationLine: "underline",
  },
  adCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  adCardText: {
    flex: 1,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  videoThumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  videoThumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  videoThumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.md,
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    minWidth: 0, // Đảm bảo flex shrink hoạt động
  },
  videoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 2,
    flexShrink: 1, // Cho phép text co lại nếu cần
  },
  videoMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoActions: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexShrink: 0, // Buttons không co lại
  },
  viewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  violationButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 70,
  },
  violationButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  reportThumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning + "20",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  reportInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  reportId: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 4,
  },
  reportStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[100],
  },
  reportStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyReportContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  });
};
