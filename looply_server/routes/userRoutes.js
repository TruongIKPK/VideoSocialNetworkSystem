import express from "express";
import multer from "multer";
import { 
    register, 
    login, 
    updateProfile, 
    getAllUsers,
    getUserById,
    searchUsers,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
} from "../controllers/userController.js";
import { authenticateToken, checkOwnership } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình multer cho upload file
const upload = multer({ dest: "uploads/" });

// Public routes (không cần authentication)
router.post("/register", register);
router.post("/login", login);
router.get("/search", searchUsers);
// Routes cụ thể phải đặt trước route dynamic
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.get("/:id", getUserById); // Route dynamic đặt cuối cùng

// Protected routes (cần authentication)
router.get("/", authenticateToken, getAllUsers);
router.put("/profile/:id", authenticateToken, checkOwnership, upload.single("avatar"), updateProfile);
router.post("/:id/follow", authenticateToken, followUser);
router.delete("/:id/follow", authenticateToken, unfollowUser);

export default router;
