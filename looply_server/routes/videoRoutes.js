import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
  searchVideos,
  getRandomVideos,
  getLatestVideos,
  searchVideosByHashtags,
  getVideosByUserId,
  getLikedVideosByUserId,
  getSavedVideosByUserId,
  getPendingModerationVideos,
  getFlaggedOrRejectedVideos,
  approveVideo,
  rejectVideo,
  flagVideo,
  updateVideoStatus,
} from "../controllers/videoController.js";
import { authenticateToken, checkOwnership, requireAdmin, checkVideoOwnership, optionalAuthenticate } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protected routes - require authentication
router.post("/upload", authenticateToken, upload.single("file"), uploadVideo); 
router.delete("/:id", authenticateToken, checkVideoOwnership, deleteVideo);

// Admin moderation routes
router.get("/moderation/pending", authenticateToken, requireAdmin, getPendingModerationVideos);
router.get("/moderation/flagged-rejected", authenticateToken, requireAdmin, getFlaggedOrRejectedVideos);
router.post("/:id/approve", authenticateToken, requireAdmin, approveVideo);
router.post("/:id/reject", authenticateToken, requireAdmin, rejectVideo);
router.post("/:id/flag", authenticateToken, requireAdmin, flagVideo);
router.put("/:id/status", authenticateToken, requireAdmin, updateVideoStatus);

// Public routes
router.get("/search", searchVideos);
router.get("/search/hashtags", searchVideosByHashtags);
router.get("/random", getRandomVideos); 
router.get("/latest", getLatestVideos);
router.get("/user/:userId", optionalAuthenticate, getVideosByUserId); // Lấy video theo userId (optional auth để owner xem tất cả)
router.get("/liked/:userId", getLikedVideosByUserId); // Lấy video đã thích
router.get("/saved/:userId", getSavedVideosByUserId); // Lấy video đã save
router.get("/", getAllVideos);
// Route get video by ID - optional auth (nếu có token và là admin thì có thể xem video vi phạm)
router.get("/:id", optionalAuthenticate, getVideoById);                       

export default router;
