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
    if (!io || !connectedUsers || !userId || !videoId || !status) {
      console.warn("[SocketHelper] Missing required parameters for moderation notification");
      return;
    }

    // Find user's socket ID
    const socketId = connectedUsers[userId];
    
    if (!socketId) {
      console.log(`[SocketHelper] User ${userId} is not connected. Notification will not be sent.`);
      // TODO: Could store notification in database for later delivery
      return;
    }

    // Prepare notification data
    const notificationData = {
      videoId,
      status,
      videoTitle,
      timestamp: new Date().toISOString(),
    };

    // Emit event to user's socket
    io.to(socketId).emit("moderation-result", notificationData);
    
    console.log(`[SocketHelper] ✅ Moderation notification sent to user ${userId} for video ${videoId} with status: ${status}`);
  } catch (error) {
    console.error("[SocketHelper] Error emitting moderation notification:", error);
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

