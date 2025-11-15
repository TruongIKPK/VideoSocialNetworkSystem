// models/VideoView.js
import mongoose from "mongoose";

const videoViewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  videoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Video", 
    required: true 
  },
  viewedAt: { 
    type: Date, 
    default: Date.now 
  },
  watchDuration: { 
    type: Number, 
    default: 0 
  },
  completed: {
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Index để tìm kiếm nhanh
videoViewSchema.index({ userId: 1, videoId: 1 });
videoViewSchema.index({ userId: 1, viewedAt: -1 });

export default mongoose.model("VideoView", videoViewSchema);