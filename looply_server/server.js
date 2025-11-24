import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the server directory
const envResult = dotenv.config({ path: join(__dirname, ".env") });

if (envResult.error) {
  console.warn("⚠️  Could not load .env file:", envResult.error.message);
  console.warn("   Trying to load from default location...");
  dotenv.config(); // Try default location
} else {
  console.log(`✅ Environment variables loaded from: ${join(__dirname, ".env")}`);
}

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
// Message and Conversation models no longer used for real-time messaging
// import Message from "./models/Message.js";
// import Conversation from "./models/Conversation.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet"; // Thêm helmet
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import videoViewRoutes from "./routes/videoViewRoutes.js";
import hashtagRoutes from "./routes/hashtagRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import saveRoutes from "./routes/saveRoutes.js";

// Import moderation services
import { initializeCollection } from "./services/qdrantService.js";
import { startModerationPolling } from "./services/moderationProcessor.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Connect to database
connectDB();

// Initialize Qdrant collection and start moderation polling after DB connection
setTimeout(async () => {
  try {
    await initializeCollection();
    // Start polling for moderation jobs every 30 seconds
    // Pass io and connectedUsers so moderation processor can emit notifications
    startModerationPolling(30000, io, connectedUsers);
  } catch (error) {
    console.error("Error initializing moderation system:", error);
  }
}, 3000);

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@looply.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        name: "Administrator",
        role: "admin",
        status: "active",
      });
      console.log("✅ Default admin user created successfully");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log("ℹ️  Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
};

// Create admin after DB connection is established
mongoose.connection.once('connected', async () => {
  console.log("📦 Database connected, initializing admin user...");
  await createDefaultAdmin();
});

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:19006",
      "https://looply-nine.vercel.app",
    ], // Add your frontend URLs
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
// Message routes disabled - messages are now stored client-side only
// app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/video-views", videoViewRoutes);
app.use("/api/hashtags", hashtagRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/saves", saveRoutes);

// Health check endpoint for quick testing
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

// Store connected users: userId -> socketId
const connectedUsers = {};

// Export io and connectedUsers for use in other modules
export { io, connectedUsers };

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("[Socket Auth] ❌ No token provided");
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Convert userId to string to ensure consistency
    socket.userId = String(decoded.userId);
    console.log("[Socket Auth] ✅ Token verified");
    console.log(`[Socket Auth] Decoded userId: ${socket.userId}`);
    console.log(`[Socket Auth] UserId type: ${typeof socket.userId}`);
    next();
  } catch (error) {
    console.error("[Socket Auth] ❌ Token verification failed:", error.message);
    next(new Error("Invalid or expired token"));
  }
});

// Lắng nghe kết nối socket
io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log("=".repeat(60));
  console.log("🔌 [Socket] New connection received");
  console.log(`[Socket] Socket ID: ${socket.id}`);
  console.log(`[Socket] User ID: ${userId}`);
  console.log(`[Socket] User ID type: ${typeof userId}`);
  console.log(`[Socket] User ID string: ${String(userId)}`);

  if (userId) {
    // Convert userId to string to ensure consistency
    const userIdString = String(userId);
    connectedUsers[userIdString] = socket.id;

    const onlineUserIds = Object.keys(connectedUsers);
    socket.emit("get-online-users", onlineUserIds);

    // Broadcast user online
    socket.broadcast.emit("user-online", { userId: userIdString });

    console.log(`✅ User ${userIdString} joined automatically.`);
    console.log(`[Socket] Stored in connectedUsers: ${userIdString} -> ${socket.id}`);
    console.log(
      `📋 Total connected: ${Object.keys(connectedUsers).length}`,
      Object.keys(connectedUsers)
    );
    console.log("=".repeat(60));
  } else {
    console.log("⚠️ Kết nối không có userId hợp lệ");
    console.log("=".repeat(60));
    // socket.disconnect(); // Tùy chọn: ngắt kết nối nếu không auth
  }

  // Send message event - Relay tin nhắn giữa 2 users
  socket.on("send-message", (data) => {
    console.log("-------------------------------------------------");
    console.log("📨 [1] SERVER NHẬN TIN TỪ:", socket.userId);
    console.log("📦 [2] Dữ liệu gửi lên:", JSON.stringify(data));

    const { to, text, type, timestamp, messageId } = data;

    // Kiểm tra người nhận có online không
    const receiverSocketId = connectedUsers[to];
    console.log(`🔍 [3] Tìm người nhận (ID: ${to})...`);

    if (receiverSocketId) {
      console.log(`✅ [4] TÌM THẤY! Socket ID: ${receiverSocketId}`);

      // Gửi đi
      io.to(receiverSocketId).emit("receive-message", {
        from: userId,
        to,
        text,
        type,
        timestamp,
        messageId,
      });
      console.log("🚀 [5] Đã chuyển tiếp tin nhắn thành công!");

      socket.emit("message-sent", { messageId, timestamp: Date.now() });
    } else {
      console.log("❌ [4] KHÔNG TÌM THẤY (Người này đang Offline hoặc sai ID)");
      console.log("📋 Danh sách đang Online:", Object.keys(connectedUsers)); // In ra xem ai đang on

      socket.emit("error-message", {
        message: "Người nhận không online",
        code: "RECEIVER_OFFLINE",
      });
    }
    console.log("-------------------------------------------------");
  });

  // Typing indicator
  socket.on("typing", (data) => {
    try {
      const { to } = data;
      if (!to) return;

      const receiverSocketId = connectedUsers[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { from: userId });
      }
    } catch (error) {
      console.error("Typing error:", error);
    }
  });

  // Stop typing
  socket.on("stop-typing", (data) => {
    try {
      const { to } = data;
      if (!to) return;

      const receiverSocketId = connectedUsers[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop-typing", { from: userId });
      }
    } catch (error) {
      console.error("Stop typing error:", error);
    }
  });

  // Seen message
  socket.on("seen", (data) => {
    try {
      const { to, messageId } = data;
      if (!to || !messageId) return;

      const senderSocketId = connectedUsers[to];
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-seen", {
          messageId: messageId,
          seenBy: userId,
        });
      }
    } catch (error) {
      console.error("Seen message error:", error);
    }
  });

  // WebRTC Signaling - Offer
  socket.on("webrtc-offer", (data) => {
    try {
      const { to, offer } = data;
      if (!to || !offer) return;

      const receiverSocketId = connectedUsers[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("webrtc-offer", {
          from: userId,
          offer: offer,
        });
      }
    } catch (error) {
      console.error("WebRTC offer error:", error);
    }
  });

  // WebRTC Signaling - Answer
  socket.on("webrtc-answer", (data) => {
    try {
      const { to, answer } = data;
      if (!to || !answer) return;

      const senderSocketId = connectedUsers[to];
      if (senderSocketId) {
        io.to(senderSocketId).emit("webrtc-answer", {
          from: userId,
          answer: answer,
        });
      }
    } catch (error) {
      console.error("WebRTC answer error:", error);
    }
  });

  // WebRTC Signaling - ICE Candidate
  socket.on("webrtc-ice-candidate", (data) => {
    try {
      const { to, candidate } = data;
      if (!to || !candidate) return;

      const receiverSocketId = connectedUsers[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("webrtc-ice-candidate", {
          from: userId,
          candidate: candidate,
        });
      }
    } catch (error) {
      console.error("WebRTC ICE candidate error:", error);
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    if (userId && connectedUsers[userId]) {
      delete connectedUsers[userId];
      // Broadcast user offline
      socket.broadcast.emit("user-offline", { userId });
      console.log(
        `User ${userId} disconnected. Total connected: ${
          Object.keys(connectedUsers).length
        }`
      );
    } else {
      console.log("User disconnected:", socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
