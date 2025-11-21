import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllVideos,
  updateVideoStatus,
  getAllComments,
  updateCommentStatus,
  getRecentVideos,
  getRecentReports,
} from "../controllers/adminController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/recent-videos", getRecentVideos);
router.get("/dashboard/recent-reports", getRecentReports);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);

// Video Management
router.get("/videos", getAllVideos);
router.put("/videos/:videoId/status", updateVideoStatus);

// Comment Management
router.get("/comments", getAllComments);
router.put("/comments/:commentId/status", updateCommentStatus);

export default router;

