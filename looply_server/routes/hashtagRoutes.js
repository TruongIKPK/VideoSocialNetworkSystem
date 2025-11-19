import express from "express";
import {
  searchHashtags,
  getTrendingHashtags,
  getAllHashtags
} from "../controllers/hashtagController.js";

const router = express.Router();

// Public routes
router.get("/search", searchHashtags);
router.get("/trending", getTrendingHashtags);
router.get("/", getAllHashtags);

export default router;

