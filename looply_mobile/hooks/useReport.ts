import { useState } from "react";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

export type ReportType = "user" | "video" | "comment";
export type ReportReason = 
  | "spam"
  | "inappropriate"
  | "harassment"
  | "violence"
  | "fake"
  | "copyright"
  | "other";

interface UseReportOptions {
  token: string | null;
}

export const useReport = ({ token }: UseReportOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = async (
    reportedType: ReportType,
    reportedId: string,
    reason: ReportReason,
    description?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return {
        success: false,
        message: "Bạn cần đăng nhập để báo cáo",
      };
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        reportedType,
        reportedId,
        reason,
      };
      
      // Nếu có description (khi reason là "other"), thêm vào body
      if (description && description.trim()) {
        body.description = description.trim();
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Báo cáo đã được gửi thành công",
        };
      } else {
        return {
          success: false,
          message: data.message || "Không thể gửi báo cáo. Vui lòng thử lại.",
        };
      }
    } catch (error) {
      console.error("Report error:", error);
      return {
        success: false,
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createReport,
    isSubmitting,
  };
};

