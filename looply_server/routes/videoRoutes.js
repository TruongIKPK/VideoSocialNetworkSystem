import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
  searchVideos,
  getRandomVideos
} from "../controllers/videoController.js";
import { authenticateToken, checkOwnership } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protected routes - require authentication
router.post("/upload", authenticateToken, upload.single("file"), uploadVideo); 
router.delete("/:id", authenticateToken, deleteVideo);

// Public routes
router.get("/search", searchVideos);
router.get("/random", getRandomVideos); 
router.get("/", getAllVideos);                              
router.get("/:id", getVideoById);                       

export default router;
