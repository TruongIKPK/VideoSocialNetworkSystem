import Like from "../models/Like.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";

export const like = async (req, res) => {
  try {
    const { userId, targetType, targetId } = req.body;

    const existing = await Like.findOne({ user: userId, targetType, targetId });
    if (existing) return res.status(400).json({ message: "Đã like rồi" });

    await Like.create({ user: userId, targetType, targetId });

    if (targetType === "video")
      await Video.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
    else
      await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });

    res.json({ message: "Đã like" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlike = async (req, res) => {
  try {
    const { userId, targetType, targetId } = req.body;

    const like = await Like.findOneAndDelete({ user: userId, targetType, targetId });
    if (!like) return res.status(404).json({ message: "Chưa like nội dung này" });

    if (targetType === "video")
      await Video.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });
    else
      await Comment.findByIdAndUpdate(targetId, { $inc: { likesCount: -1 } });

    res.json({ message: "Đã bỏ like" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
