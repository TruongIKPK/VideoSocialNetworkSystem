import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber, getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

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
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [recentVideoReports, setRecentVideoReports] = useState<RecentReport[]>([]);
  const [recentCommentReports, setRecentCommentReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (!token) {
        console.warn("No token available");
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
      console.log("📊 Fetching stats from:", statsUrl);
      const statsResponse = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("✅ Dashboard stats:", statsData);
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error(`❌ Failed to fetch stats: ${statsResponse.status} ${statsResponse.statusText}`);
        console.error(`❌ Error response:`, errorText);
        console.error(`❌ Request URL:`, statsUrl);
        
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
      const videosUrl = `${API_BASE_URL}/admin/dashboard/recent-videos?limit=3`;
      console.log("📹 Fetching recent videos from:", videosUrl);
      let videosResponse = await fetch(videosUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route videos/latest
      if (videosResponse.status === 404) {
        const errorText = await videosResponse.text();
        console.warn("⚠️ Admin route not found (404), using fallback: /api/videos/latest");
        console.warn("⚠️ Error response:", errorText);
        videosResponse = await fetch(`${API_BASE_URL}/videos/latest`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log("✅ Recent videos response:", videosData);
        let videosList = videosData.videos || videosData || [];
        
        // Nếu dùng fallback route, limit 3 videos
        if (Array.isArray(videosList) && videosList.length > 3) {
          videosList = videosList.slice(0, 3);
        }
        
        console.log("✅ Recent videos list:", videosList);
        console.log("✅ Recent videos count:", videosList.length);
        setRecentVideos(Array.isArray(videosList) ? videosList : []);
      } else {
        const errorText = await videosResponse.text();
        console.error("❌ Failed to fetch videos:", videosResponse.status);
        console.error("❌ Error details:", errorText);
        // Keep empty array, will show "Chưa có video nào"
        setRecentVideos([]);
      }

      // Fetch recent VIDEO reports - mặc định hiển thị 3 video reports mới nhất
      const videoReportsUrl = `${API_BASE_URL}/admin/dashboard/recent-reports?limit=3&type=video`;
      console.log("🚩 Fetching video reports from:", videoReportsUrl);
      let videoReportsResponse = await fetch(videoReportsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route reports
      if (videoReportsResponse.status === 404) {
        // Chỉ log một lần, không log error response để tránh spam
        console.log("ℹ️ Admin recent-reports route not available (404), using fallback: /api/reports");
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
        
        console.log("✅ Recent video reports:", reportsList.length);
        setRecentVideoReports(Array.isArray(reportsList) ? reportsList : []);
      } else {
        console.error("❌ Failed to fetch video reports:", videoReportsResponse.status);
        setRecentVideoReports([]);
      }

      // Fetch recent COMMENT reports - mặc định hiển thị 3 comment reports mới nhất
      const commentReportsUrl = `${API_BASE_URL}/admin/dashboard/recent-reports?limit=3&type=comment`;
      console.log("🚩 Fetching comment reports from:", commentReportsUrl);
      let commentReportsResponse = await fetch(commentReportsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Fallback: Nếu admin route không hoạt động (404), dùng route reports
      if (commentReportsResponse.status === 404) {
        // Chỉ log một lần, không log error response để tránh spam
        console.log("ℹ️ Admin recent-reports route not available (404), using fallback: /api/reports");
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
        
        console.log("✅ Recent comment reports:", reportsList.length);
        setRecentCommentReports(Array.isArray(reportsList) ? reportsList : []);
      } else {
        console.error("❌ Failed to fetch comment reports:", commentReportsResponse.status);
        setRecentCommentReports([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set fallback data on error
      setStats({
        total: { users: 0, videos: 0, reports: 0 },
        today: { users: 0, videos: 0, reports: 0 },
        users: { active: 0, locked: 0 },
        videos: { active: 0, violation: 0 },
        reports: { pending: 0, resolved: 0 },
      });
    } finally {
      setIsLoading(false);
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

        {/* Dashboard Content */}
        <View style={styles.dashboardCard}>
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
              <Text style={styles.sectionTitle}>Video gần đây</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/videos")}>
                <Text style={styles.viewAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {recentVideos.length > 0 ? (
              recentVideos.slice(0, 3).map((video) => (
                <View key={video._id} style={styles.videoItem}>
                  <View style={styles.videoThumbnail}>
                    {/* <Ionicons name="videocam" size={24} color="#fff" /> */}
                    <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnailImage} />
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <Text style={styles.videoMeta}>
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
              <Text style={styles.sectionTitle}>Báo cáo video</Text>
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
                <Text style={styles.emptySubtext}>
                  Các báo cáo video mới sẽ hiển thị ở đây
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 120, // Đủ space cho tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  dashboardCard: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dashboardTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#D1D1D1",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  statSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs / 2,
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
  },
  adCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  adCardText: {
    flex: 1,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  videoThumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  videoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 2,
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
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  reportThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
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
