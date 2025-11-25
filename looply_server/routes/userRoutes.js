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
    getMe,
    updateUserStatus,
    checkFollow,
    getUserTotalLikes,
} from "../controllers/userController.js";
import { authenticateToken, checkOwnership, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình multer cho upload file
const upload = multer({ dest: "uploads/" });

// Public routes (không cần authentication)
router.post("/register", register);
router.post("/login", login);
router.get("/search", searchUsers);
// Routes cụ thể phải đặt trước route dynamic
router.get("/:userId/total-likes", getUserTotalLikes); // Lấy tổng số lượt like từ video của user
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

// Protected routes (cần authentication)
router.get("/", authenticateToken, getAllUsers);
router.get("/me", authenticateToken, getMe);
router.get("/check-follow", authenticateToken, checkFollow);
router.put("/profile/:id", authenticateToken, checkOwnership, upload.single("avatar"), updateProfile);
router.post("/:id/follow", authenticateToken, followUser);
router.delete("/:id/follow", authenticateToken, unfollowUser);
router.put("/:id/status", authenticateToken, requireAdmin, updateUserStatus);
router.get("/:id", getUserById); 
export default router;
