import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ReportReason } from "@/hooks/useReport";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => Promise<void>;
  type: "user" | "video" | "comment";
  isSubmitting?: boolean;
}

const REPORT_REASONS: { value: ReportReason; label: string; icon: string }[] = [
  { value: "spam", label: "Spam", icon: "ban-outline" },
  { value: "inappropriate", label: "Nội dung không phù hợp", icon: "warning-outline" },
  { value: "harassment", label: "Quấy rối", icon: "alert-circle-outline" },
  { value: "violence", label: "Bạo lực", icon: "shield-outline" },
  { value: "fake", label: "Thông tin giả mạo", icon: "close-circle-outline" },
  { value: "copyright", label: "Vi phạm bản quyền", icon: "document-text-outline" },
  { value: "other", label: "Khác", icon: "ellipsis-horizontal-outline" },
];

export const ReportModal = ({
  visible,
  onClose,
  onSubmit,
  type,
  isSubmitting = false,
}: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 10,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 30,
        friction: 10,
      }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (selectedReason) {
      await onSubmit(selectedReason);
      if (!isSubmitting) {
        onClose();
        setSelectedReason(null);
      }
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "user":
        return "người dùng này";
      case "video":
        return "video này";
      case "comment":
        return "bình luận này";
      default:
        return "nội dung này";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Báo cáo {getTypeLabel()}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Vui lòng chọn lý do báo cáo:</Text>

            {/* Reason options */}
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.value && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={
                      selectedReason === reason.value
                        ? Colors.primary
                        : Colors.gray[600]
                    }
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.value && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: SCREEN_HEIGHT * 0.7,
  },
  safeArea: {
    flex: 1,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.black,
    fontFamily: Typography.fontFamily.bold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[600],
    fontFamily: Typography.fontFamily.regular,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  reasonsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: "transparent",
  },
  reasonItemSelected: {
    backgroundColor: Colors.primary + "10",
    borderColor: Colors.primary,
  },
  reasonText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.gray[700],
    fontFamily: Typography.fontFamily.regular,
    marginLeft: Spacing.md,
  },
  reasonTextSelected: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[300],
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
});

