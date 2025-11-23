import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reportedType: { type: String, enum: ["user", "video", "comment"], required: true },
  reportedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "resolved", "rejected"], default: "pending" },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);

