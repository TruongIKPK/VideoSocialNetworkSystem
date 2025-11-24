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
  const startTime = Date.now();

  console.log("=".repeat(60));
  console.log("[UploadService] 🎬 Bắt đầu upload video");
  console.log("[UploadService] ⏰ Thời gian bắt đầu:", new Date().toISOString());
  console.log("[UploadService] 📝 Thông tin:");
  console.log("  - Title:", title);
  console.log("  - Description:", description || "(không có)");
  console.log("  - Media URI:", mediaUri.substring(0, 50) + "...");
  console.log("  - File Extension:", fileExtension);

  try {
    // Step 1: Get authentication token
    console.log("[UploadService] 🔑 [Bước 1/4] Lấy authentication token...");
    const token = await getToken();
    
    if (!token) {
      console.log("[UploadService] ❌ [Bước 1/4] Không tìm thấy token đăng nhập");
      await scheduleNotification(
        "Lỗi đăng nhập",
        "Vui lòng đăng nhập lại để upload video"
      );
      return {
        success: false,
        error: "Không tìm thấy token đăng nhập",
      };
    }
    console.log("[UploadService] ✅ [Bước 1/4] Đã lấy token thành công");

    // Step 2: Prepare form data
    console.log("[UploadService] 📦 [Bước 2/4] Chuẩn bị FormData...");
    
    // Check if file exists (for React Native)
    try {
      const fileInfo = await fetch(mediaUri);
      if (!fileInfo.ok) {
        throw new Error("Không thể đọc file video. Vui lòng chọn lại video.");
      }
      console.log("[UploadService] ✅ File có thể đọc được");
    } catch (fileError: any) {
      console.log("[UploadService] ⚠️ Không thể kiểm tra file:", fileError.message);
      // Continue anyway, might work on device
    }
    
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    // Determine file type and name
    const ext = fileExtension || mediaUri.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
    const fileName = `upload.${ext}`;

    console.log("[UploadService] 📄 File info:");
    console.log("  - File name:", fileName);
    console.log("  - MIME type:", mimeType);
    console.log("  - Extension:", ext);
    console.log("  - Media URI:", mediaUri);

    // Append file - React Native FormData format
    formData.append("file", {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    } as any);
    
    console.log("[UploadService] ✅ [Bước 2/4] FormData đã được chuẩn bị");

    // Step 3: Send request to server
    console.log("[UploadService] 🌐 [Bước 3/4] Gửi request lên server...");
    console.log("[UploadService] 📡 URL:", `${API_BASE_URL}/videos/upload`);
    console.log("[UploadService] ⏳ Đang upload (có thể mất vài phút tùy vào kích thước video)...");
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const requestStartTime = Date.now();
    
    const timeoutId = setTimeout(() => {
      console.log("[UploadService] ⏰ Timeout sau 10 phút - hủy request");
      controller.abort();
    }, 10 * 60 * 1000); // 10 minutes timeout
    
    // Add heartbeat log every 30 seconds to show progress
    const heartbeatInterval = setInterval(() => {
      const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(0);
      console.log(`[UploadService] 💓 Upload vẫn đang chạy... (${elapsed}s)`);
    }, 30000); // Every 30 seconds
    
    let response;
    
    try {
      console.log("[UploadService] 🚀 Bắt đầu fetch request...");
      response = await fetch(`${API_BASE_URL}/videos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
          // DO NOT set Content-Type - let browser/React Native set it with boundary
          // This is critical for FormData to work correctly
        },
        body: formData,
        signal: controller.signal, // Add abort signal for timeout
      });
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      clearInterval(heartbeatInterval); // Clear heartbeat
      console.log("[UploadService] ✅ Fetch request hoàn tất");
    } catch (fetchError: any) {
      clearTimeout(timeoutId); // Clear timeout on error
      clearInterval(heartbeatInterval); // Clear heartbeat
      
      if (fetchError.name === 'AbortError') {
        console.log("[UploadService] ❌ Request bị timeout sau 10 phút");
        throw new Error("Upload video mất quá nhiều thời gian. Vui lòng kiểm tra kết nối internet và thử lại với video nhỏ hơn.");
      }
      
      console.log("[UploadService] ❌ Lỗi network:", fetchError.message);
      console.log("[UploadService] 📄 Error type:", fetchError.name);
      console.log("[UploadService] 📄 Error stack:", fetchError.stack);
      throw new Error(`Lỗi kết nối: ${fetchError.message}. Vui lòng kiểm tra internet và thử lại.`);
    }
    
    const requestDuration = Date.now() - requestStartTime;
    
    console.log("[UploadService] 📥 [Bước 3/4] Nhận response từ server");
    console.log("[UploadService] 📊 Response status:", response.status, response.statusText);
    console.log("[UploadService] ⏱️ Thời gian upload:", `${(requestDuration / 1000).toFixed(2)}s`);

    // Step 4: Handle response
    console.log("[UploadService] 🔍 [Bước 4/4] Xử lý response...");
    
    if (response.ok) {
      const data = await response.json();
      console.log("[UploadService] ✅ [Bước 4/4] Upload thành công!");
      console.log("[UploadService] 📊 Video data:");
      console.log("  - Video ID:", data._id);
      console.log("  - Moderation Status:", data.moderationStatus || "pending");
      console.log("  - Video URL:", data.url?.substring(0, 50) + "..." || "N/A");
      
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

      console.log("[UploadService] 📢 Gửi thông báo thành công...");
      // Send success notification
      await scheduleNotification(notificationTitle, notificationBody, {
        type: "upload_success",
        videoId: data._id,
        moderationStatus,
      });
      console.log("[UploadService] ✅ Đã gửi thông báo thành công");

      const totalDuration = Date.now() - startTime;
      console.log("[UploadService] 🎉 Upload hoàn tất thành công!");
      console.log("[UploadService] ⏱️ Tổng thời gian:", `${(totalDuration / 1000).toFixed(2)}s`);
      console.log("=".repeat(60));

      return {
        success: true,
        message: notificationBody,
        data,
      };
    } else {
      // Handle error response
      console.log("[UploadService] ❌ [Bước 4/4] Upload thất bại");
      const errorText = await response.text();
      let errorMessage = "Lỗi khi upload video";
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
        console.log("[UploadService] 📄 Error response:", JSON.stringify(errorJson, null, 2));
      } catch {
        errorMessage = errorText || errorMessage;
        console.log("[UploadService] 📄 Error text:", errorText);
      }

      console.log("[UploadService] 📢 Gửi thông báo lỗi...");
      // Send error notification
      await scheduleNotification(
        "Lỗi upload video",
        errorMessage
      );
      console.log("[UploadService] ✅ Đã gửi thông báo lỗi");

      const totalDuration = Date.now() - startTime;
      console.log("[UploadService] ❌ Upload thất bại!");
      console.log("[UploadService] ⏱️ Tổng thời gian:", `${(totalDuration / 1000).toFixed(2)}s`);
      console.log("=".repeat(60));

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (err: any) {
    console.error("[UploadService] ❌ Exception xảy ra:", err);
    console.error("[UploadService] 📄 Error details:", JSON.stringify(err, null, 2));
    
    const errorMessage = err.message || "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.";
    
    console.log("[UploadService] 📢 Gửi thông báo lỗi...");
    // Send error notification
    await scheduleNotification(
      "Lỗi upload video",
      errorMessage
    );
    console.log("[UploadService] ✅ Đã gửi thông báo lỗi");

    const totalDuration = Date.now() - startTime;
    console.log("[UploadService] ❌ Upload thất bại do exception!");
    console.log("[UploadService] ⏱️ Tổng thời gian:", `${(totalDuration / 1000).toFixed(2)}s`);
    console.log("=".repeat(60));

    return {
      success: false,
      error: errorMessage,
    };
  }
}

