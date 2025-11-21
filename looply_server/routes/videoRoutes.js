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
  updateVideoStatus,
  getVideosByUserId,
  getLikedVideosByUserId,
  getSavedVideosByUserId
} from "../controllers/videoController.js";
import { authenticateToken, checkOwnership, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protected routes - require authentication
router.post("/upload", authenticateToken, upload.single("file"), uploadVideo); 
router.delete("/:id", authenticateToken, deleteVideo);
router.put("/:id/status", authenticateToken, requireAdmin, updateVideoStatus);

// Public routes
router.get("/search", searchVideos);
router.get("/search/hashtags", searchVideosByHashtags);
router.get("/random", getRandomVideos); 
router.get("/latest", getLatestVideos);
router.get("/user/:userId", getVideosByUserId); // Lấy video theo userId
router.get("/liked/:userId", getLikedVideosByUserId); // Lấy video đã thích
router.get("/saved/:userId", getSavedVideosByUserId); // Lấy video đã save
router.get("/", getAllVideos);                              
router.get("/:id", getVideoById);                       

export default router;
