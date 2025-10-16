import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
} from "../controllers/videoController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // dùng multer upload file

router.post("/upload", upload.single("file"), uploadVideo); // upload video
router.get("/", getAllVideos);                              // lấy tất cả video
router.get("/:id", getVideoById);                           // lấy chi tiết video
router.delete("/:id", deleteVideo);                         // xóa video

export default router;
