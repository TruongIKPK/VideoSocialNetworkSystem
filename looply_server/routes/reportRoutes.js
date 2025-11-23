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

// Protected route - any authenticated user can create a report
router.post("/", authenticateToken, createReport);

// Admin only routes
router.get("/", authenticateToken, requireAdmin, getReports);
router.get("/:id", authenticateToken, requireAdmin, getReportById);
router.put("/:id/status", authenticateToken, requireAdmin, updateReportStatus);
router.get("/type/:type", authenticateToken, requireAdmin, getReportsByType);

export default router;

