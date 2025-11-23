import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://videosocialnetworksystem.onrender.com";

class SocketService {
  private socket: Socket | null = null;

  // 1. Kết nối
  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token }, // Gửi token để server xác thực userId
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("🟢 Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });
    
    this.socket.on("error-message", (data) => {
        console.log("⚠️ Socket Error:", data);
    });
  }

  // 2. Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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