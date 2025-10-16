import express from "express";
import { follow, unfollow } from "../controllers/followController.js";

const router = express.Router();

router.post("/follow", follow);     // theo dõi user
router.post("/unfollow", unfollow); // bỏ theo dõi user

export default router;
