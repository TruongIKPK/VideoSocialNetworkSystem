import express from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  getReportsByType
} from "../controllers/reportController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Log all requests to report routes
router.use((req, res, next) => {
  console.log(`[ReportRoutes] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

// Protected route - any authenticated user can create a report
router.post("/", authenticateToken, (req, res, next) => {
  console.log("📝 Create report route handler called");
  next();
}, createReport);

// Admin only routes
router.get("/", authenticateToken, requireAdmin, getReports);
router.get("/:id", authenticateToken, requireAdmin, getReportById);
router.put("/:id/status", authenticateToken, requireAdmin, updateReportStatus);
router.get("/type/:type", authenticateToken, requireAdmin, getReportsByType);

export default router;

