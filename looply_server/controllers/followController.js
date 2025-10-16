import Follow from "../models/Follow.js";
import User from "../models/User.js";

export const follow = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    if (followerId === followingId)
      return res.status(400).json({ message: "Không thể tự theo dõi chính mình" });

    const exist = await Follow.findOne({ follower: followerId, following: followingId });
    if (exist) return res.status(400).json({ message: "Đã theo dõi rồi" });

    await Follow.create({ follower: followerId, following: followingId });

    await User.findByIdAndUpdate(followerId, { $inc: { following: 1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followers: 1 } });

    res.json({ message: "Đã theo dõi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollow = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    const follow = await Follow.findOneAndDelete({ follower: followerId, following: followingId });
    if (!follow) return res.status(404).json({ message: "Chưa theo dõi người này" });

    await User.findByIdAndUpdate(followerId, { $inc: { following: -1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followers: -1 } });

    res.json({ message: "Đã bỏ theo dõi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
