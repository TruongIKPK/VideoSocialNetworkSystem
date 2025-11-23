import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface Report {
  _id: string;
  reporterId?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
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

export default function AdminReportsScreen() {
  const router = useRouter();
  const { token } = useUser();
  const { user } = useCurrentUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      if (!token) {
        console.warn("No token available");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reportList = Array.isArray(data) ? data : (data.reports || []);
        setReports(reportList);
      } else {
        console.error("Failed to fetch reports:", response.status, await response.text());
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
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

  const formatReportMeta = (item: Report) => {
    const typeText = getReportedTypeText(item.reportedType);
    return `${typeText} - ${item.reason} - ${formatTimeAgo(item.createdAt)}`;
  };

  const formatReportId = (id: string) => {
    // Extract last 3 characters from ObjectId and convert to number
    // ObjectId is hex, so we take last 3 chars and convert to decimal
    const lastChars = id.slice(-3);
    // Convert hex to decimal, then mod 1000 to get 3-digit number
    const num = parseInt(lastChars, 16) % 1000;
    // Ensure it's at least 100 to match pattern #101, #102, etc.
    const displayNum = num < 100 ? num + 100 : num;
    return `#${displayNum.toString()}`;
  };

  const handleViewReport = (report: Report) => {
    // Navigate đến report detail để xem chi tiết và nội dung (comment/video)
    router.push({
      pathname: "/(admin)/reports/report-detail",
      params: {
        reportId: report._id,
      },
    });
  };

  const renderReportItem = ({ item }: { item: Report }) => (
      <View style={styles.reportItem}>
        <View style={styles.reportThumbnail}>
          <Ionicons 
            name="flag" 
            size={24} 
            color={
              item.status === "resolved" ? "#10B981" :
              item.status === "rejected" ? "#EF4444" :
              "#F59E0B"
            } 
          />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportId}>
            {`Báo cáo ${formatReportId(item._id)}`}
          </Text>
          <Text style={styles.reportMeta}>
            {formatReportMeta(item)}
          </Text>
          {item.status && (
            <Text style={[
              styles.reportStatus,
              item.status === "resolved" && styles.reportStatusResolved,
              item.status === "rejected" && styles.reportStatusRejected,
            ]}>
              {item.status === "pending" ? "Đang chờ" :
               item.status === "resolved" ? "Đã xử lý" :
               item.status === "rejected" ? "Đã từ chối" : item.status}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewReport(item._id)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewButtonText}>Xem</Text>
        </TouchableOpacity>
      </View>
  );

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

        {/* New Reports Section */}
        <View style={styles.reportsCard}>
          <Text style={styles.reportsTitle}>Báo cáo mới</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : reports.length > 0 ? (
            <View style={styles.reportsList}>
              {reports.map((item) => (
                <View key={item._id} style={styles.reportItem}>
                  <View style={styles.reportThumbnail}>
                    <Ionicons 
                      name="flag" 
                      size={24} 
                      color={
                        item.status === "resolved" ? "#10B981" :
                        item.status === "rejected" ? "#EF4444" :
                        "#F59E0B"
                      } 
                    />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportId}>
                      {`Báo cáo ${formatReportId(item._id)}`}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {formatReportMeta(item)}
                    </Text>
                    {item.status && (
                      <Text style={[
                        styles.reportStatus,
                        item.status === "resolved" && styles.reportStatusResolved,
                        item.status === "rejected" && styles.reportStatusRejected,
                      ]}>
                        {item.status === "pending" ? "Đang chờ" :
                         item.status === "resolved" ? "Đã xử lý" :
                         item.status === "rejected" ? "Đã từ chối" : item.status}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewReport(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewButtonText}>Xem</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có báo cáo nào</Text>
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
    paddingBottom: 120, // Đủ space cho tab bar
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
  reportsCard: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  reportsTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  reportsList: {
    gap: Spacing.sm,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
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
    marginTop: 2,
  },
  reportStatus: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[100],
    alignSelf: "flex-start",
  },
  reportStatusResolved: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  reportStatusRejected: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
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
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});

