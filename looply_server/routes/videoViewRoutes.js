// routes/videoViewRoutes.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  recordVideoView,
  getRecommendedVideos,
  checkVideoViewed,
  getVideoViewCount
} from "../controllers/videoViewController.js";

const router = express.Router();

router.post("/record", authenticateToken, recordVideoView);
router.get("/recommended", authenticateToken, getRecommendedVideos);
router.get("/check/:videoId", authenticateToken, checkVideoViewed);
// API công khai để lấy số lượt xem (không cần authenticate)
router.get("/count/:videoId", getVideoViewCount);

export default router;