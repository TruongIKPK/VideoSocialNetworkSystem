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
router.get("/dashboard/stats", (req, res, next) => {
  console.log("📊 Dashboard stats route hit");
  next();
}, getDashboardStats);

router.get("/dashboard/recent-videos", (req, res, next) => {
  console.log("📹 Recent videos route hit");
  next();
}, getRecentVideos);

router.get("/dashboard/recent-reports", (req, res, next) => {
  console.log("🚩 Recent reports route hit");
  next();
}, getRecentReports);

// Debug: Test route
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working" });
});

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

