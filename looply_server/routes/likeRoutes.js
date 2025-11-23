import express from "express";
import { like, unlike, checkLike } from "../controllers/likeController.js";

const router = express.Router();

router.post("/like", like);     // like nội dung
router.post("/unlike", unlike); // bỏ like
router.get("/check", checkLike); // kiểm tra đã like chưa

export default router;
