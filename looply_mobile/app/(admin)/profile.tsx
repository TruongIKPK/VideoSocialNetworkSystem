import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface StatsData {
  users: number;
  videos: number;
  reports: number;
}

interface RecentVideo {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  user: {
    name: string;
  };
}

interface RecentReport {
  _id: string;
  reportId: string;
  type: string;
  reason: string;
  createdAt: string;
  targetType: string;
}

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<StatsData>({ users: 0, videos: 0, reports: 0 });
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch stats
      // TODO: Replace with actual API endpoints
      setStats({ users: 2, videos: 2, reports: 2 });
      
      // Fetch recent videos
      // TODO: Replace with actual API endpoint
      setRecentVideos([
        {
          _id: "1",
          title: "Hướng dẫn nấu phở",
          thumbnail: "",
          views: 1245,
          user: { name: "anhHai" },
        },
        {
          _id: "2",
          title: "Hướng dẫn nấu phở",
          thumbnail: "",
          views: 1245,
          user: { name: "anhHai" },
        },
        {
          _id: "3",
          title: "Hướng dẫn nấu phở",
          thumbnail: "",
          views: 1245,
          user: { name: "anhHai" },
        },
      ]);

      // Fetch recent reports
      // TODO: Replace with actual API endpoint
      setRecentReports([
        {
          _id: "1",
          reportId: "Báo cáo #101",
          type: "video",
          reason: "Nội dung bản quyền",
          createdAt: new Date().toISOString(),
          targetType: "video",
        },
        {
          _id: "2",
          reportId: "Báo cáo #102",
          type: "video",
          reason: "Nội dung bản quyền",
          createdAt: new Date().toISOString(),
          targetType: "video",
        },
        {
          _id: "3",
          reportId: "Báo cáo #103",
          type: "video",
          reason: "Nội dung bản quyền",
          createdAt: new Date().toISOString(),
          targetType: "video",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* Admin Info */}
        <View style={styles.adminInfo}>
          <Image
            source={getAvatarUri(user?.avatar)}
            style={styles.avatar}
          />
          <Text style={styles.adminName}>Admin</Text>
          <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
        </View>

        {/* Quick Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan nhanh</Text>
          <Text style={styles.cardSubtitle}>Số liệu hệ thống hôm nay</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Người dùng</Text>
              <Text style={styles.statValue}>{formatNumber(stats.users)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Video</Text>
              <Text style={styles.statValue}>{formatNumber(stats.videos)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Báo cáo</Text>
              <Text style={styles.statValue}>{formatNumber(stats.reports)}</Text>
            </View>
          </View>
        </View>

        {/* Ad Management Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push("/(admin)/ads")}
          activeOpacity={0.7}
        >
          <View style={styles.adCardContent}>
            <Ionicons name="megaphone" size={24} color={Colors.primary} />
            <View style={styles.adCardText}>
              <Text style={styles.cardTitle}>Quản lý quảng cáo</Text>
              <Text style={styles.cardSubtitle}>Tạo và quản lý quảng cáo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>

        {/* Recent Videos */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Video gần đây</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/videos")}>
              <Text style={styles.viewAllLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {recentVideos.map((video) => (
            <View key={video._id} style={styles.videoItem}>
              <View style={styles.videoThumbnail}>
                <Ionicons name="videocam" size={24} color="#10B981" />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoMeta}>
                  {video.user.name} • {formatNumber(video.views)} lượt xem
                </Text>
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>Xem</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.violationButton}>
                  <Text style={styles.violationButtonText}>Vi phạm</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* New Reports */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Báo cáo mới</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/reports")}>
              <Text style={styles.viewAllLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {recentReports.map((report) => (
            <View key={report._id} style={styles.reportItem}>
              <View style={styles.reportThumbnail}>
                <Ionicons name="flag" size={24} color="#10B981" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportId}>{report.reportId}</Text>
                <Text style={styles.reportMeta}>
                  {report.targetType} • {report.reason} • {formatTimeAgo(report.createdAt)}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Xem</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[200],
  },
  adminName: {
    fontSize: Typography.fontSize.xxl,
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
  card: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
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
  adCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  adCardText: {
    flex: 1,
  },
});

