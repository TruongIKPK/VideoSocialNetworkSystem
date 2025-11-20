import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  thumbnail: String,
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },

  user: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    avatar: String,
  },

  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["active", "violation"], default: "active" },

}, { timestamps: true });

export default mongoose.model("Video", videoSchema);
