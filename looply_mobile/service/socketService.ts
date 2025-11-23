import { io, Socket } from "socket.io-client";
import { scheduleNotification } from "@/utils/notifications";

const SOCKET_URL = "https://videosocialnetworksystem.onrender.com";

interface ModerationResult {
  videoId: string;
  status: "approved" | "flagged" | "rejected";
  videoTitle: string;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private currentToken: string | null = null;

  // 1. Kết nối
  connect(token: string) {
    // Nếu đã connected với cùng token, không kết nối lại
    if (this.socket?.connected && this.currentToken === token) {
      console.log("🟢 Socket already connected with same token");
      // Đảm bảo moderation listener vẫn được setup
      this.setupModerationListener();
      return;
    }

    // Nếu đang connecting, không kết nối lại
    if (this.isConnecting) {
      console.log("⏳ Socket is already connecting, skipping...");
      return;
    }

    // Nếu có socket cũ nhưng token khác, disconnect trước
    if (this.socket && this.currentToken !== token) {
      console.log("🔄 Token changed, disconnecting old socket...");
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    this.currentToken = token;

    console.log("🔄 Đang kết nối Socket...");
    this.socket = io(SOCKET_URL, {
      auth: { token }, // Gửi token để server xác thực userId
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("🟢 Socket connected:", this.socket?.id);
      this.isConnecting = false;
      // Setup moderation listener khi connect
      this.setupModerationListener();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      this.isConnecting = false;
    });

    this.socket.on("connect_error", (error) => {
      console.log("❌ Socket connection error:", error.message);
      this.isConnecting = false;
    });
    
    this.socket.on("error-message", (data) => {
        console.log("⚠️ Socket Error:", data);
    });

    // Setup moderation listener ngay cả khi chưa connect (sẽ hoạt động sau khi connect)
    this.setupModerationListener();
  }

  // Setup listener cho moderation-result event
  private setupModerationListener() {
    if (!this.socket) {
      console.log("[SocketService] ⚠️ No socket available for moderation listener");
      return;
    }

    // Remove old listener first
    this.socket.off("moderation-result");

    // Add new listener
    this.socket.on("moderation-result", (data: ModerationResult) => {
      console.log("=".repeat(60));
      console.log("[SocketService] 📨 Received 'moderation-result' event!");
      console.log("[SocketService] Event data:", JSON.stringify(data, null, 2));
      console.log(`[SocketService] Video ID: ${data.videoId}`);
      console.log(`[SocketService] Status: ${data.status}`);
      console.log(`[SocketService] Video Title: ${data.videoTitle || "(không có)"}`);
      console.log(`[SocketService] Timestamp: ${data.timestamp}`);
      console.log(`[SocketService] Current socket ID: ${this.socket?.id}`);
      
      let notificationTitle = "";
      let notificationBody = "";

      if (data.status === "approved") {
        notificationTitle = "Video đã được duyệt thành công";
        notificationBody = `Video "${data.videoTitle || "của bạn"}" đã được duyệt và đã được đăng!`;
      } else if (data.status === "flagged") {
        notificationTitle = "Video vi phạm quy tắc cộng đồng";
        notificationBody = `Video "${data.videoTitle || "của bạn"}" vi phạm quy tắc cộng đồng, chờ quản trị viên duyệt.`;
      } else if (data.status === "rejected") {
        notificationTitle = "Video đã bị từ chối";
        notificationBody = `Video "${data.videoTitle || "của bạn"}" đã bị từ chối vì vi phạm quy tắc cộng đồng.`;
      }

      console.log(`[SocketService] 📱 Notification Title: "${notificationTitle}"`);
      console.log(`[SocketService] 📱 Notification Body: "${notificationBody}"`);

      // Schedule notification
      if (notificationTitle && notificationBody) {
        console.log("[SocketService] 📤 Scheduling notification...");
        scheduleNotification(notificationTitle, notificationBody, {
          type: "moderation_result",
          videoId: data.videoId,
          status: data.status,
        }).then((notificationId) => {
          if (notificationId) {
            console.log(`[SocketService] ✅ Notification scheduled successfully! ID: ${notificationId}`);
          } else {
            console.warn("[SocketService] ⚠️ Failed to schedule notification (no ID returned)");
          }
        }).catch((error) => {
          console.error("[SocketService] ❌ Error scheduling notification:", error);
        });
      } else {
        console.warn("[SocketService] ⚠️ No notification title/body, skipping notification");
      }
      console.log("=".repeat(60));
    });

    console.log("[SocketService] ✅ Moderation result listener setup complete");
  }

  // 2. Ngắt kết nối
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket...");
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.currentToken = null;
    }
  }

  // 3. Gửi tin nhắn
  sendMessage(data: any) {
    // data: { to, text, type, timestamp, messageId }
    this.socket?.emit("send-message", data);
  }

  sendTyping(toUserId: string) {
    this.socket?.emit("typing", { to: toUserId });
  }

  // 2. Gửi sự kiện "Dừng nhập"
  sendStopTyping(toUserId: string) {
    this.socket?.emit("stop-typing", { to: toUserId });
  }

  // 3. Gửi sự kiện "Đã xem"
  markAsSeen(toUserId: string, messageId: string) {
    this.socket?.emit("seen", { to: toUserId, messageId });
  }

  // 4. Lắng nghe sự kiện (nhận tin, typing...)
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();