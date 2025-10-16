import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  user: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    avatar: String,
  },
  likesCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
