import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

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
  
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [violationDetails, setViolationDetails] = useState<string>("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Get video data from params or use defaults
  const videoId = (Array.isArray(params.videoId) ? params.videoId[0] : params.videoId) || "1";
  const videoUrl = (Array.isArray(params.videoUrl) ? params.videoUrl[0] : params.videoUrl) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const title = (Array.isArray(params.title) ? params.title[0] : params.title) || "Hướng dẫn nấu phở";
  const author = (Array.isArray(params.author) ? params.author[0] : params.author) || "anhHai";
  const views = parseInt((Array.isArray(params.views) ? params.views[0] : params.views) || "1245");

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.play();
  });

  const handleSkip = () => {
    // TODO: Implement skip logic - move to next video
    Alert.alert("Thông báo", "Đã bỏ qua video này");
    router.replace("/(admin)/videos");
  };

  const handleViolation = () => {
    setShowViolationModal(true);
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

    try {
      // TODO: Implement API call to report violation
      console.log("Reporting violation:", {
        videoId,
        reason: selectedReason,
        details: violationDetails,
      });

      Alert.alert("Thành công", "Đã báo cáo vi phạm thành công", [
        {
          text: "OK",
            onPress: () => {
              handleCloseModal();
              router.replace("/(admin)/videos");
            },
        },
      ]);
    } catch (error) {
      console.error("Error reporting violation:", error);
      Alert.alert("Lỗi", "Không thể báo cáo vi phạm. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(admin)/videos")}
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
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
          </View>
        </View>
      </View>

      {/* Video Info Card */}
      <View style={styles.videoCard}>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {title}
          </Text>
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
          <TouchableOpacity
            style={styles.violationButton}
            onPress={handleViolation}
            activeOpacity={0.7}
          >
            <Text style={styles.violationButtonText}>Vi phạm</Text>
          </TouchableOpacity>
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
                style={styles.confirmButton}
                onPress={handleConfirmViolation}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10,
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
  },
  adminName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: "#1E3A5F",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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
  videoInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  videoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs / 2,
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
});

