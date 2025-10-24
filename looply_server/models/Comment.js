import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // Thêm dòng này
  likesCount: { type: Number, default: 0 },
  likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
