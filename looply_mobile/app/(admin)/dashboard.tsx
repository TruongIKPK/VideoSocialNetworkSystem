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
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
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
      const statsResponse = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Dashboard stats:", statsData);
        setStats(statsData);
      } else {
        console.error("Failed to fetch stats:", statsResponse.status);
        // Set fallback stats
        setStats({
          total: { users: 0, videos: 0, reports: 0 },
          today: { users: 0, videos: 0, reports: 0 },
          users: { active: 0, locked: 0 },
          videos: { active: 0, violation: 0 },
          reports: { pending: 0, resolved: 0 },
        });
      }

      // Fetch recent videos (limit to 3 for display)
      const videosResponse = await fetch(`${API_BASE_URL}/admin/dashboard/recent-videos?limit=3`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log("Recent videos:", videosData);
        setRecentVideos(videosData.videos || []);
      } else {
        console.error("Failed to fetch videos:", videosResponse.status);
        // Keep empty array, will show "Chưa có video nào"
      }

      // Fetch recent reports
      const reportsResponse = await fetch(`${API_BASE_URL}/admin/dashboard/recent-reports?limit=3`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        console.log("Recent reports:", reportsData);
        setRecentReports(reportsData.reports || []);
      } else {
        console.error("Failed to fetch reports:", reportsResponse.status);
        // Keep empty array, will show "Chưa có báo cáo nào"
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.adminName}>Admin</Text>
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
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
            onPress={() => router.push("/(admin)/ads")}
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
                    <Ionicons name="videocam" size={24} color="#10B981" />
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
                        pathname: "/(admin)/video-detail",
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
                        pathname: "/(admin)/video-detail",
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

          {/* New Reports */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Báo cáo mới</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/reports")}>
                <Text style={styles.viewAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {recentReports.length > 0 ? (
              recentReports.slice(0, 3).map((report) => (
                <View key={report._id} style={styles.reportItem}>
                  <View style={styles.reportThumbnail}>
                    <Ionicons name="flag" size={24} color="#10B981" />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportId}>Báo cáo #{report._id.slice(-6)}</Text>
                    <Text style={styles.reportMeta}>
                      {report.reportedType} • {report.reason} • {formatTimeAgo(report.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => router.push("/(admin)/reports")}
                  >
                    <Text style={styles.viewButtonText}>Xem</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có báo cáo nào</Text>
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
    paddingBottom: 100,
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
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
});
