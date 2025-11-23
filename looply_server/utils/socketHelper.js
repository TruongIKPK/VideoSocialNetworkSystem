/**
 * Helper functions for Socket.IO notifications
 */

/**
 * Emit moderation notification to user
 * @param {Object} io - Socket.IO server instance
 * @param {Object} connectedUsers - Map of userId -> socketId
 * @param {string} userId - User ID to send notification to
 * @param {string} videoId - Video ID
 * @param {string} status - Moderation status: "approved", "flagged", "rejected"
 * @param {string} videoTitle - Video title (optional)
 */
export function emitModerationNotification(io, connectedUsers, userId, videoId, status, videoTitle = "") {
  try {
    console.log("=".repeat(60));
    console.log("[SocketHelper] 📢 Bắt đầu gửi thông báo moderation");
    console.log(`[SocketHelper] User ID: ${userId}`);
    console.log(`[SocketHelper] Video ID: ${videoId}`);
    console.log(`[SocketHelper] Video Title: ${videoTitle || "(không có)"}`);
    console.log(`[SocketHelper] Status: ${status}`);
    console.log(`[SocketHelper] Timestamp: ${new Date().toISOString()}`);

    if (!io || !connectedUsers || !userId || !videoId || !status) {
      console.warn("[SocketHelper] ⚠️ Missing required parameters for moderation notification");
      console.warn(`[SocketHelper] io: ${!!io}, connectedUsers: ${!!connectedUsers}, userId: ${!!userId}, videoId: ${!!videoId}, status: ${!!status}`);
      console.log("=".repeat(60));
      return;
    }

    // Find user's socket ID
    const socketId = connectedUsers[userId];
    
    if (!socketId) {
      console.log(`[SocketHelper] ❌ User ${userId} is not connected. Notification will not be sent.`);
      console.log(`[SocketHelper] Total connected users: ${Object.keys(connectedUsers).length}`);
      console.log(`[SocketHelper] Connected user IDs: ${Object.keys(connectedUsers).join(", ")}`);
      // TODO: Could store notification in database for later delivery
      console.log("=".repeat(60));
      return;
    }

    console.log(`[SocketHelper] ✅ User ${userId} is connected with socket ID: ${socketId}`);

    // Prepare notification data
    const notificationData = {
      videoId,
      status,
      videoTitle,
      timestamp: new Date().toISOString(),
    };

    console.log(`[SocketHelper] 📦 Notification data:`, JSON.stringify(notificationData, null, 2));

    // Emit event to user's socket
    io.to(socketId).emit("moderation-result", notificationData);
    
    // Determine message based on status
    let statusMessage = "";
    switch (status) {
      case "approved":
        statusMessage = "Video đã được duyệt thành công";
        break;
      case "flagged":
        statusMessage = "Video vi phạm quy tắc cộng đồng, chờ quản trị viên duyệt";
        break;
      case "rejected":
        statusMessage = "Video đã bị từ chối vì vi phạm quy tắc cộng đồng";
        break;
      default:
        statusMessage = `Status: ${status}`;
    }
    
    console.log(`[SocketHelper] ✅ Moderation notification sent successfully!`);
    console.log(`[SocketHelper] 📱 Message to user: "${statusMessage}"`);
    console.log(`[SocketHelper] 🎯 Sent to socket: ${socketId}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("[SocketHelper] ❌ Error emitting moderation notification:", error);
    console.error("[SocketHelper] Error stack:", error.stack);
    console.log("=".repeat(60));
  }
}

/**
 * Get connected users count (for debugging)
 * @param {Object} connectedUsers - Map of userId -> socketId
 * @returns {number} Number of connected users
 */
export function getConnectedUsersCount(connectedUsers) {
  return connectedUsers ? Object.keys(connectedUsers).length : 0;
}

