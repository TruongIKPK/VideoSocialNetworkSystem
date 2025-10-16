import express from "express";
import {
  addComment,
  getCommentsByVideo,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/", addComment);                // thêm bình luận
router.get("/:videoId", getCommentsByVideo); // lấy comment theo video

export default router;
