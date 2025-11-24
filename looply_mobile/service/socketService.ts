import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://videosocialnetworksystem.onrender.com";

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private currentToken: string | null = null;

  // 1. Kết nối
  connect(token: string) {
    // Nếu đã connected với cùng token, không kết nối lại
    if (this.socket?.connected && this.currentToken === token) {
      console.log("🟢 Socket already connected with same token");
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

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();