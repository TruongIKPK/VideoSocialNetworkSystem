import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "/no_avatar.png" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "locked"], default: "active" },
  followers: { type: Number, default: 0 },
  followersList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: { type: Number, default: 0 },
  followingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("User", userSchema);
