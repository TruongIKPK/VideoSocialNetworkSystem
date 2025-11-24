import { getToken } from "@/utils/tokenStorage";
import { scheduleNotification } from "@/utils/notifications";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

export interface UploadVideoParams {
  title: string;
  description: string;
  mediaUri: string;
  fileExtension?: string;
}

export interface UploadResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Upload video asynchronously and send notification when complete
 * This function runs in the background and doesn't block the UI
 * @param {UploadVideoParams} params - Upload parameters
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadVideoAsync(params: UploadVideoParams): Promise<UploadResult> {
  const { title, description, mediaUri, fileExtension } = params;

  try {
    // Get authentication token
    const token = await getToken();
    
    if (!token) {
      await scheduleNotification(
        "Lỗi đăng nhập",
        "Vui lòng đăng nhập lại để upload video"
      );
      return {
        success: false,
        error: "Không tìm thấy token đăng nhập",
      };
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    // Determine file type and name
    const ext = fileExtension || mediaUri.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
    const fileName = `upload.${ext}`;

    formData.append("file", {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    } as any);

    // Start upload
    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check moderation status
      const moderationStatus = data.moderationStatus || "pending";
      let notificationTitle = "Video đã được đăng!";
      let notificationBody = "Video của bạn đã được đăng thành công.";
      
      if (moderationStatus === "pending") {
        notificationTitle = "Video đang được kiểm duyệt";
        notificationBody = "Video của bạn đang được kiểm duyệt. Bạn sẽ được thông báo khi video được duyệt.";
      } else if (moderationStatus === "flagged" || moderationStatus === "rejected") {
        notificationTitle = "Video cần xem xét";
        notificationBody = "Video của bạn cần được xem xét bởi quản trị viên trước khi được hiển thị.";
      }

      // Send success notification
      await scheduleNotification(notificationTitle, notificationBody, {
        type: "upload_success",
        videoId: data._id,
        moderationStatus,
      });

      return {
        success: true,
        message: notificationBody,
        data,
      };
    } else {
      // Handle error response
      const errorText = await response.text();
      let errorMessage = "Lỗi khi upload video";
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      // Send error notification
      await scheduleNotification(
        "Lỗi upload video",
        errorMessage
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    
    const errorMessage = err.message || "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.";
    
    // Send error notification
    await scheduleNotification(
      "Lỗi upload video",
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

