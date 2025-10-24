import express from "express";
import { createOrGetConversation } from "../controllers/conversationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, createOrGetConversation);

export default router;