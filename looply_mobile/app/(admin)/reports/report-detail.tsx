import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

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
  
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;

  useEffect(() => {
    if (reportId && token) {
      fetchReport();
    }
  }, [reportId, token]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      if (!token) {
        console.warn("No token available");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch report:", response.status, errorText);
        Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !reportId) {
      Alert.alert("Lỗi", "Không có token hoặc report ID");
      return;
    }

    try {
      setIsUpdating(true);

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

      if (response.ok) {
        const updatedReport = await response.json();
        setReport(updatedReport.report);
        Alert.alert("Thành công", `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể cập nhật trạng thái");
      }
    } catch (error: any) {
      console.error("Error updating report status:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    } finally {
      setIsUpdating(false);
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.replace("/(admin)/reports")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Info Card */}
        <View style={styles.card}>
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
            <Text style={styles.infoLabel}>Lý do:</Text>
            <Text style={styles.reasonText}>{report.reason}</Text>
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

        {/* Action Buttons */}
        {report.status === "pending" && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Thao tác</Text>
            <View style={styles.actionsButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.resolveButton]}
                onPress={() => handleUpdateStatus("resolved")}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {isUpdating ? (
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
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                {isUpdating ? (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  reasonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    backgroundColor: Colors.gray[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});

