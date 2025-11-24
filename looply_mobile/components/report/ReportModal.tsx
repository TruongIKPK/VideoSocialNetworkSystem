import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { ReportReason } from "@/hooks/useReport";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description?: string) => Promise<void>;
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
  const [otherDescription, setOtherDescription] = useState<string>("");
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setOtherDescription("");
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
      // Nếu là "other", cần có mô tả
      if (selectedReason === "other" && !otherDescription.trim()) {
        return; // Không submit nếu chưa nhập mô tả
      }
      
      await onSubmit(
        selectedReason,
        selectedReason === "other" ? otherDescription.trim() : undefined
      );
      if (!isSubmitting) {
        onClose();
        setSelectedReason(null);
        setOtherDescription("");
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

            {/* Header - Fixed */}
            <View style={styles.header}>
              <Text style={styles.title}>Báo cáo {getTypeLabel()}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Vui lòng chọn lý do báo cáo:</Text>

            {/* Reason options - Scrollable */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.reasonsContainer}
              showsVerticalScrollIndicator={true}
            >
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
              
              {/* Text input for "other" reason */}
              {selectedReason === "other" && (
                <View style={styles.otherInputContainer}>
                  <Text style={styles.otherInputLabel}>
                    Vui lòng mô tả lý do báo cáo:
                  </Text>
                  <TextInput
                    style={styles.otherInput}
                    placeholder="Nhập lý do báo cáo..."
                    placeholderTextColor={Colors.gray[400]}
                    value={otherDescription}
                    onChangeText={setOtherDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isSubmitting}
                  />
                  {!otherDescription.trim() && (
                    <Text style={styles.otherInputHint}>
                      Vui lòng nhập lý do báo cáo để tiếp tục
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Submit button - Fixed at bottom */}
            <View style={styles.submitButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting || (selectedReason === "other" && !otherDescription.trim())) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting || (selectedReason === "other" && !otherDescription.trim())}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
                )}
              </TouchableOpacity>
            </View>
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
  scrollContainer: {
    flex: 1,
  },
  reasonsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
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
  otherInputContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  otherInputLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[700],
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
  },
  otherInput: {
    backgroundColor: Colors.gray[50],
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.black,
    fontFamily: Typography.fontFamily.regular,
    minHeight: 100,
    maxHeight: 150,
  },
  otherInputHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xs,
  },
  submitButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
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

