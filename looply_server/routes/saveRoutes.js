import express from "express";
import { saveVideo, unsaveVideo, checkSave, getSavedVideos } from "../controllers/saveController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Protected routes (cần authentication)
router.post("/save", authenticateToken, saveVideo);
router.post("/unsave", authenticateToken, unsaveVideo);
router.get("/check", checkSave); // Public để check trạng thái
router.get("/:userId/videos", getSavedVideos); // Lấy danh sách video đã save

export default router;

