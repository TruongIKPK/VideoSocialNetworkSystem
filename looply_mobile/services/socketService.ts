import { io, Socket } from "socket.io-client";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com";

let socket: Socket | null = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface ModerationResult {
  videoId: string;
  status: "approved" | "flagged" | "rejected";
  videoTitle: string;
  timestamp: string;
}

export type ModerationResultCallback = (data: ModerationResult) => void;

/**
 * Setup moderation result listener on socket
 * @param {Socket} socket - Socket instance
 * @param {ModerationResultCallback} handler - Callback function
 */
function setupModerationResultListener(socket: Socket, handler: ModerationResultCallback) {
  // Remove any existing listener first
  socket.off("moderation-result");
  
  // Add new listener
  socket.on("moderation-result", (data: ModerationResult) => {
    console.log("=".repeat(60));
    console.log("[SocketService] 📨 Received 'moderation-result' event from server!");
    console.log("[SocketService] Event data:", JSON.stringify(data, null, 2));
    console.log(`[SocketService] Video ID: ${data.videoId}`);
    console.log(`[SocketService] Status: ${data.status}`);
    console.log(`[SocketService] Video Title: ${data.videoTitle || "(không có)"}`);
    console.log(`[SocketService] Timestamp: ${data.timestamp}`);
    console.log(`[SocketService] Current socket ID: ${socket.id}`);
    
    if (handler) {
      console.log("[SocketService] ✅ Calling moderation result handler...");
      try {
        handler(data);
        console.log("[SocketService] ✅ Handler executed successfully");
      } catch (error) {
        console.error("[SocketService] ❌ Error in moderation result handler:", error);
        console.error("[SocketService] Error stack:", error instanceof Error ? error.stack : "No stack");
      }
    } else {
      console.warn("[SocketService] ⚠️ No moderation result handler provided");
    }
    console.log("=".repeat(60));
  });
  
  console.log("[SocketService] ✅ Moderation result listener setup complete");
}

/**
 * Connect to Socket.IO server
 * @param {string} token - JWT authentication token
 * @param {ModerationResultCallback} onModerationResult - Callback when moderation result is received
 * @returns {Socket | null} Socket instance or null if connection failed
 */
export function connectSocket(
  token: string,
  onModerationResult?: ModerationResultCallback
): Socket | null {
  console.log("=".repeat(60));
  console.log("[SocketService] 🔌 connectSocket called");
  console.log(`[SocketService] Token provided: ${!!token}`);
  console.log(`[SocketService] Token length: ${token?.length || 0}`);
  console.log(`[SocketService] Handler provided: ${!!onModerationResult}`);
  console.log(`[SocketService] Current socket exists: ${!!socket}`);
  console.log(`[SocketService] Current socket connected: ${socket?.connected || false}`);
  console.log(`[SocketService] Current socket ID: ${socket?.id || "none"}`);

  // If socket exists and is connected, just update the listener
  if (socket?.connected) {
    console.log("[SocketService] ⚠️ Socket already connected, updating listener only");
    console.log(`[SocketService] Current socket ID: ${socket.id}`);
    
    // Remove old listener and add new one if handler changed
    socket.off("moderation-result");
    if (onModerationResult) {
      console.log("[SocketService] 🔄 Re-setting up moderation-result listener...");
      setupModerationResultListener(socket, onModerationResult);
    }
    console.log("=".repeat(60));
    return socket;
  }

  // If socket exists but not connected, clean it up
  if (socket && !socket.connected) {
    console.log("[SocketService] ⚠️ Socket exists but not connected, cleaning up old socket...");
    socket.removeAllListeners();
    socket = null;
    isConnected = false;
  }

  try {
    // Only create new socket if we don't have a connected one
    if (socket && socket.connected) {
      console.log("[SocketService] ⚠️ Socket already exists and connected, reusing it");
      if (onModerationResult) {
        setupModerationResultListener(socket, onModerationResult);
      }
      return socket;
    }

    console.log(`[SocketService] 🌐 Connecting to: ${API_BASE_URL}`);
    console.log(`[SocketService] 🔑 Using token for authentication...`);

    // Create new socket connection
    socket = io(API_BASE_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection event handlers
    socket.on("connect", () => {
      console.log("=".repeat(60));
      console.log("[SocketService] ✅ Connected to server successfully!");
      console.log(`[SocketService] Socket ID: ${socket?.id}`);
      console.log(`[SocketService] Server URL: ${API_BASE_URL}`);
      console.log(`[SocketService] Transport: ${socket?.io?.engine?.transport?.name || "unknown"}`);
      isConnected = true;
      reconnectAttempts = 0;
      
      // Setup moderation result listener after connection
      if (onModerationResult) {
        console.log("[SocketService] 📡 Setting up moderation-result listener...");
        setupModerationResultListener(socket, onModerationResult);
      }
      console.log("=".repeat(60));
    });

    socket.on("disconnect", (reason) => {
      console.log("=".repeat(60));
      console.log("[SocketService] ❌ Disconnected from server");
      console.log(`[SocketService] Reason: ${reason}`);
      console.log(`[SocketService] Socket ID was: ${socket?.id || "unknown"}`);
      isConnected = false;
      console.log("=".repeat(60));
    });

    socket.on("connect_error", (error) => {
      console.error("=".repeat(60));
      console.error("[SocketService] ❌ Connection error occurred");
      console.error(`[SocketService] Error message: ${error.message}`);
      console.error(`[SocketService] Error type: ${error.type}`);
      console.error(`[SocketService] Error details:`, JSON.stringify(error, null, 2));
      reconnectAttempts++;
      console.error(`[SocketService] Reconnection attempt: ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("[SocketService] ⚠️ Max reconnection attempts reached");
      }
      console.error("=".repeat(60));
    });

    // Setup moderation result listener immediately (will work after connect)
    if (onModerationResult) {
      setupModerationResultListener(socket, onModerationResult);
    }

    // Also listen for any events to debug
    socket.onAny((eventName, ...args) => {
      console.log(`[SocketService] 📨 Received event: ${eventName}`, args);
    });

    return socket;
  } catch (error) {
    console.error("[SocketService] Error connecting to server:", error);
    return null;
  }
}

/**
 * Disconnect from Socket.IO server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log("[SocketService] Disconnected from server");
  }
}

/**
 * Check if socket is connected
 * @returns {boolean} True if connected, false otherwise
 */
export function isSocketConnected(): boolean {
  return isConnected && socket?.connected === true;
}

/**
 * Get current socket instance
 * @returns {Socket | null} Socket instance or null
 */
export function getSocket(): Socket | null {
  return socket;
}

