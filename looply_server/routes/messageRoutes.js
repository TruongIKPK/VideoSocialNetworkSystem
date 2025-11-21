// Message routes disabled - messages are now stored client-side only (AsyncStorage/SQLite)
// All messaging is handled through Socket.IO real-time events

import express from "express";
// import Message from "../models/Message.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Routes commented out - messages are stored locally on client
// Lấy lịch sử tin nhắn của 1 cuộc trò chuyện
// router.get("/:conversationId", authenticateToken, async (req, res) => {
//   try {
//     const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Return empty array or error message
router.get("/:conversationId", authenticateToken, async (req, res) => {
  res.json({ 
    message: "Messages are stored client-side only. Use Socket.IO for real-time messaging.",
    messages: []
  });
});

export default router;