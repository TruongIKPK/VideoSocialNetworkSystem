import express from "express";
import { like, unlike } from "../controllers/likeController.js";

const router = express.Router();

router.post("/like", like);     // like nội dung
router.post("/unlike", unlike); // bỏ like

export default router;
