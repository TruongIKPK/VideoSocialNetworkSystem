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
  console.log(`[AdminRoutes] ${req.method} ${req.path}`);
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
router.put("/videos/:videoId/status", (req, res, next) => {
  console.log(`🎬 Update video status route hit - PUT /api/admin/videos/${req.params.videoId}/status`);
  console.log(`   Request body:`, req.body);
  next();
}, updateVideoStatus);

// Comment Management
router.get("/comments", getAllComments);
router.put("/comments/:commentId/status", updateCommentStatus);

export default router;

