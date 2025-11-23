import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getVideoById,
  getAllVideos,
  updateVideoStatus,
  getAllComments,
  updateCommentStatus,
  deleteComment,
  getRecentVideos,
  getRecentReports,
  getReportByIdAdmin,
  updateReportStatusAdmin,
} from "../controllers/adminController.js";
import {
  getReports,
  getReportsByType,
} from "../controllers/reportController.js";
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
// IMPORTANT: Put more specific routes BEFORE generic routes to avoid route conflicts
router.put("/videos/:videoId/status", updateVideoStatus);
router.get("/videos/:videoId", getVideoById);
router.get("/videos", getAllVideos);

// Comment Management
router.get("/comments", getAllComments);
router.put("/comments/:commentId/status", updateCommentStatus);
router.delete("/comments/:commentId", deleteComment);

// Reports Management
router.get("/reports/type/:type", getReportsByType);
router.put("/reports/:reportId/status", updateReportStatusAdmin);
router.get("/reports/:reportId", getReportByIdAdmin);
router.get("/reports", getReports);

// Catch-all route handler - should be last
router.use((req, res) => {
  res.status(404).json({ 
    message: "Admin route not found",
    path: req.path,
    method: req.method,
  });
});

export default router;

