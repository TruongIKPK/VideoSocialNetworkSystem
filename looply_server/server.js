import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Message from "./models/Message.js"; // Đảm bảo đã tạo model Message
import Conversation from "./models/Conversation.js";
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


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Connect to database
connectDB();

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
        status: "active"
      });
      console.log("Default admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Wait for DB connection then create admin
setTimeout(async () => {
  await createDefaultAdmin();
}, 2000);

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:19006",
  ], // Add your frontend URLs
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/video-views", videoViewRoutes);
app.use("/api/hashtags", hashtagRoutes);
app.use("/api/reports", reportRoutes);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Lắng nghe kết nối socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("send-message", async (data) => {
    // data: { conversationId, sender, text }
    try {
      // Kiểm tra conversation có đúng 2 user không (bảo mật)
      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation || conversation.members.length !== 2) {
        return socket.emit("error-message", { message: "Cuộc trò chuyện không hợp lệ" });
      }

      // Lưu tin nhắn vào database
      const message = await Message.create({
        conversationId: data.conversationId,
        sender: data.sender,
        text: data.text
      });

      // Gửi tin nhắn vừa lưu tới các user trong room
      io.to(data.conversationId).emit("receive-message", {
        _id: message._id,
        conversationId: message.conversationId,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt
      });
    } catch (error) {
      socket.emit("error-message", { message: "Không gửi được tin nhắn" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
