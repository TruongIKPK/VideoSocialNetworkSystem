import express from "express";
import multer from "multer";
import { 
    register, 
    login, 
    updateProfile, 
    getAllUsers,
    searchUsers,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getMe,
    updateUserStatus,
    checkFollow,
} from "../controllers/userController.js";
import { authenticateToken, checkOwnership, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình multer cho upload file
const upload = multer({ dest: "uploads/" });

// Public routes (không cần authentication)
router.post("/register", register);
router.post("/login", login);
router.get("/search", searchUsers);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

// Protected routes (cần authentication)
router.get("/", authenticateToken, getAllUsers);
router.get("/me", authenticateToken, getMe);
router.get("/check-follow", authenticateToken, checkFollow); // Kiểm tra đã follow chưa
router.put("/profile/:id", authenticateToken, checkOwnership, upload.single("avatar"), updateProfile);
router.put("/:id/status", authenticateToken, requireAdmin, updateUserStatus);
router.post("/:id/follow", authenticateToken, followUser);
router.delete("/:id/follow", authenticateToken, unfollowUser);

export default router;
