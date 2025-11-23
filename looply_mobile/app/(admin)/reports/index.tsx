import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const Colors = useColors(); // Get theme-aware colors
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

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
          onPress={() => handleViewReport(item)}
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

        {/* New Reports Section */}
        <View style={styles.reportsCard}>
          <View style={styles.reportsCardContent}>
          <Text style={styles.reportsTitle}>Danh sách báo cáo</Text>
          
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  reportsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  reportsCardContent: {
    paddingHorizontal: Spacing.lg,
    width: "100%",
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
    marginBottom: Spacing.md,
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
    minWidth: 0,
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
    backgroundColor: Colors.success + "20",
    color: Colors.success,
    fontFamily: Typography.fontFamily.medium,
  },
  reportStatusRejected: {
    backgroundColor: Colors.error + "20",
    color: Colors.error,
    fontFamily: Typography.fontFamily.medium,
  },
  viewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
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
};

