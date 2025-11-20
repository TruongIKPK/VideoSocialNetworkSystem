import mongoose from "mongoose";
import dotenv from "dotenv";
import Hashtag from "./models/Hashtag.js";
import connectDB from "./config/db.js";

dotenv.config();

const sampleHashtags = [
  { name: "viral", count: 150, trending: true, lastUsed: new Date() },
  { name: "funny", count: 120, trending: true, lastUsed: new Date() },
  { name: "music", count: 200, trending: true, lastUsed: new Date() },
  { name: "dance", count: 180, trending: true, lastUsed: new Date() },
  { name: "comedy", count: 95, trending: true, lastUsed: new Date() },
  { name: "tutorial", count: 85, trending: false, lastUsed: new Date() },
  { name: "cooking", count: 75, trending: false, lastUsed: new Date() },
  { name: "gaming", count: 160, trending: true, lastUsed: new Date() },
  { name: "beauty", count: 110, trending: true, lastUsed: new Date() },
  { name: "fashion", count: 90, trending: false, lastUsed: new Date() },
  { name: "travel", count: 70, trending: false, lastUsed: new Date() },
  { name: "fitness", count: 100, trending: true, lastUsed: new Date() },
  { name: "pet", count: 140, trending: true, lastUsed: new Date() },
  { name: "art", count: 65, trending: false, lastUsed: new Date() },
  { name: "nature", count: 55, trending: false, lastUsed: new Date() },
  { name: "food", count: 130, trending: true, lastUsed: new Date() },
  { name: "sports", count: 105, trending: true, lastUsed: new Date() },
  { name: "tech", count: 80, trending: false, lastUsed: new Date() },
  { name: "diy", count: 60, trending: false, lastUsed: new Date() },
  { name: "lifestyle", count: 95, trending: false, lastUsed: new Date() },
];

const seedHashtags = async () => {
  try {
    await connectDB();
    
    // Xóa tất cả hashtag cũ
    await Hashtag.deleteMany({});
    console.log("Đã xóa tất cả hashtag cũ");

    // Thêm hashtag mới
    await Hashtag.insertMany(sampleHashtags);
    console.log(`Đã thêm ${sampleHashtags.length} hashtag mẫu`);

    console.log("Seeding hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi seeding hashtags:", error);
    process.exit(1);
  }
};

seedHashtags();

