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
  followersList: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    // Không dùng unique: true vì nó sẽ áp dụng cho toàn bộ array, không phải từng phần tử
  }],
  following: { type: Number, default: 0 },
  followingList: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    // Không dùng unique: true vì nó sẽ áp dụng cho toàn bộ array, không phải từng phần tử
  }],
}, { timestamps: true });

// Thêm index để đảm bảo performance khi query
userSchema.index({ followingList: 1 });
userSchema.index({ followersList: 1 });

export default mongoose.model("User", userSchema);
