import express from "express";
import multer from "multer";
import { register, login, updateProfile, getAllUsers } from "../controllers/userController.js";
import { authenticateToken, checkOwnership } from "../middleware/auth.js";

const router = express.Router();

// Cấu hình multer cho upload file
const upload = multer({ dest: "uploads/" });

// Public routes (không cần authentication)
router.post("/register", register);
router.post("/login", login);

// Protected routes (cần authentication)
router.get("/", authenticateToken, getAllUsers);
router.put("/profile/:id", authenticateToken, checkOwnership, upload.single("avatar"), updateProfile);

export default router;
