import express from "express";
import {
  addComment,
  getCommentsByVideo,
  likeComment,
  unlikeComment,
  updateCommentStatus,
} from "../controllers/commentController.js";

import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Protected route - cần authentication
router.post("/", authenticateToken, addComment);
router.post("/:id/like", authenticateToken, likeComment);
router.post("/:id/unlike", authenticateToken, unlikeComment);
router.put("/:id/status", authenticateToken, requireAdmin, updateCommentStatus);

// Public route
router.get("/:videoId", getCommentsByVideo);

export default router;
