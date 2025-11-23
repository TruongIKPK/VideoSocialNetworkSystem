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
} from "../controllers/adminController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Test route KHÔNG cần auth - để kiểm tra routing có hoạt động không
router.get("/ping", (req, res) => {
  res.json({ 
    message: "Admin routes are reachable!",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Test route để verify recent-reports route exists (KHÔNG cần auth)
router.get("/test-recent-reports-route", (req, res) => {
  res.json({ 
    message: "Recent reports route exists!",
    route: "/api/admin/dashboard/recent-reports",
    note: "This route requires authentication and admin role"
  });
});

// Log all requests to admin routes
router.use((req, res, next) => {
  console.log(`[AdminRoutes] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get("/dashboard/stats", (req, res, next) => {
  console.log("📊 Dashboard stats route handler called");
  next();
}, getDashboardStats);

router.get("/dashboard/recent-videos", (req, res, next) => {
  console.log("📹 Recent videos route handler called");
  next();
}, getRecentVideos);

router.get("/dashboard/recent-reports", (req, res, next) => {
  console.log("🚩 Recent reports route handler called");
  next();
}, getRecentReports);

// Debug: Test routes (đặt TRƯỚC middleware để test routing)
router.get("/test-public", (req, res) => {
  res.json({ message: "Admin routes routing works - no auth required" });
});

// Debug: Test route (sau middleware - cần auth)
router.get("/test", (req, res) => {
  res.json({ 
    message: "Admin routes are working",
    user: req.user?.username,
    role: req.user?.role
  });
});


// User Management
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);

// Video Management
router.get("/videos", (req, res, next) => {
  console.log("📹 Admin videos route hit - GET /api/admin/videos");
  next();
}, getAllVideos);
// IMPORTANT: Put more specific routes BEFORE generic routes to avoid route conflicts
// Route /videos/:videoId/status must come BEFORE /videos/:videoId
router.put("/videos/:videoId/status", (req, res, next) => {
  console.log(`🎬 Update video status route MATCHED - PUT /api/admin/videos/${req.params.videoId}/status`);
  console.log(`   Video ID param:`, req.params.videoId);
  console.log(`   Request body:`, req.body);
  console.log(`   Request path:`, req.path);
  console.log(`   Request originalUrl:`, req.originalUrl);
  next();
}, updateVideoStatus);
router.get("/videos/:videoId", (req, res, next) => {
  console.log(`📹 Get video by ID route hit - GET /api/admin/videos/${req.params.videoId}`);
  next();
}, getVideoById);

// Comment Management
router.get("/comments", getAllComments);
router.put("/comments/:commentId/status", updateCommentStatus);
router.delete("/comments/:commentId", deleteComment);

// Catch-all route handler for debugging - should be last
router.use((req, res) => {
  console.error(`[AdminRoutes] ❌ Route not found: ${req.method} ${req.path}`);
  console.error(`[AdminRoutes] Original URL: ${req.originalUrl}`);
  console.error(`[AdminRoutes] Available routes: /dashboard/stats, /dashboard/recent-videos, /dashboard/recent-reports, /users, /videos, /comments`);
  res.status(404).json({ 
    message: "Admin route not found",
    path: req.path,
    method: req.method,
    availableRoutes: [
      "GET /api/admin/dashboard/stats",
      "GET /api/admin/dashboard/recent-videos",
      "GET /api/admin/dashboard/recent-reports",
      "GET /api/admin/users",
      "GET /api/admin/videos",
      "GET /api/admin/videos/:videoId",
      "PUT /api/admin/videos/:videoId/status",
      "GET /api/admin/comments"
    ]
  });
});

export default router;

