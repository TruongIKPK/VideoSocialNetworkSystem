import mongoose from "mongoose";

const saveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
}, { timestamps: true });

saveSchema.index({ user: 1, videoId: 1 }, { unique: true });

export default mongoose.model("Save", saveSchema);

