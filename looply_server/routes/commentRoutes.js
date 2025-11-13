import express from "express";
import {
  addComment,
  getCommentsByVideo,
    likeComment,
  unlikeComment,
} from "../controllers/commentController.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Protected route - cần authentication
router.post("/", authenticateToken, addComment);
router.post("/:id/like", authenticateToken, likeComment);
router.post("/:id/unlike", authenticateToken, unlikeComment);

// Public route
router.get("/:videoId", getCommentsByVideo);

export default router;
