import { useEffect, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { connectSocket, disconnectSocket, ModerationResult } from "@/services/socketService";
import { scheduleNotification } from "@/utils/notifications";

/**
 * SocketManager component handles Socket.IO connection and moderation events
 * Should be placed inside UserProvider to access user context
 */
export function SocketManager() {
  const { token, isAuthenticated, user } = useUser();
  const socketConnectedRef = useRef(false);
  const previousTokenRef = useRef<string | null>(null);
  const previousAuthRef = useRef<boolean>(false);

  useEffect(() => {
    console.log("=".repeat(60));
    console.log("[SocketManager] 🔄 SocketManager effect triggered");
    console.log(`[SocketManager] isAuthenticated: ${isAuthenticated}`);
    console.log(`[SocketManager] hasToken: ${!!token}`);
    console.log(`[SocketManager] token length: ${token?.length || 0}`);
    console.log(`[SocketManager] User ID: ${user?._id || "unknown"}`);
    console.log(`[SocketManager] Previous token: ${previousTokenRef.current ? "exists" : "none"}`);
    console.log(`[SocketManager] Previous auth: ${previousAuthRef.current}`);
    console.log(`[SocketManager] Token changed: ${previousTokenRef.current !== token}`);
    console.log(`[SocketManager] Auth changed: ${previousAuthRef.current !== isAuthenticated}`);

    // Check if authentication status changed
    const authChanged = previousAuthRef.current !== isAuthenticated;
    const tokenChanged = previousTokenRef.current !== token;

    if (!isAuthenticated || !token) {
      console.log("[SocketManager] ⚠️ User not authenticated or no token");
      // Only disconnect if we were previously connected
      if (socketConnectedRef.current || previousAuthRef.current) {
        console.log("[SocketManager] 🔌 Disconnecting socket (user logged out or token removed)...");
        disconnectSocket();
        socketConnectedRef.current = false;
      }
      previousTokenRef.current = token;
      previousAuthRef.current = isAuthenticated;
      console.log("=".repeat(60));
      return;
    }

    // If already connected and token/auth didn't change, don't reconnect
    if (socketConnectedRef.current && !authChanged && !tokenChanged) {
      console.log("[SocketManager] ✅ Socket already connected and credentials unchanged, skipping reconnect");
      console.log("=".repeat(60));
      return;
    }

    console.log("[SocketManager] ✅ User authenticated, setting up socket connection...");

    // Connect socket when user is authenticated
    const handleModerationResult = (data: ModerationResult) => {
      console.log("=".repeat(60));
      console.log("[SocketManager] 📨 Moderation result received!");
      console.log("[SocketManager] Data:", JSON.stringify(data, null, 2));
      console.log(`[SocketManager] Video ID: ${data.videoId}`);
      console.log(`[SocketManager] Status: ${data.status}`);
      console.log(`[SocketManager] Video Title: ${data.videoTitle || "(không có)"}`);
      
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

      console.log(`[SocketManager] 📱 Notification Title: "${notificationTitle}"`);
      console.log(`[SocketManager] 📱 Notification Body: "${notificationBody}"`);

      // Schedule notification
      if (notificationTitle && notificationBody) {
        console.log("[SocketManager] 📤 Scheduling notification...");
        scheduleNotification(notificationTitle, notificationBody, {
          type: "moderation_result",
          videoId: data.videoId,
          status: data.status,
        }).then((notificationId) => {
          if (notificationId) {
            console.log(`[SocketManager] ✅ Notification scheduled successfully! ID: ${notificationId}`);
          } else {
            console.warn("[SocketManager] ⚠️ Failed to schedule notification (no ID returned)");
          }
        }).catch((error) => {
          console.error("[SocketManager] ❌ Error scheduling notification:", error);
        });
      } else {
        console.warn("[SocketManager] ⚠️ No notification title/body, skipping notification");
      }
      console.log("=".repeat(60));
    };

    // Connect socket with moderation result handler
    console.log("[SocketManager] 🔌 Connecting to socket server...");
    const socket = connectSocket(token, handleModerationResult);
    
    if (socket) {
      console.log("[SocketManager] ✅ Socket connection initiated");
      socketConnectedRef.current = true;
      previousTokenRef.current = token;
      previousAuthRef.current = isAuthenticated;
    } else {
      console.error("[SocketManager] ❌ Failed to create socket connection");
    }

    // Cleanup ONLY on unmount or when authentication actually changes
    return () => {
      // Only cleanup if component is unmounting or auth status changed
      // Don't cleanup on every re-render
      console.log("[SocketManager] 🧹 Cleanup function called");
      // Note: We don't disconnect here to prevent premature disconnection
      // The next effect will handle disconnection if needed
      console.log("=".repeat(60));
    };
  }, [token, isAuthenticated]);

  // This component doesn't render anything
  return null;
}
