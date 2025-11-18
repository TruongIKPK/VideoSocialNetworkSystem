import Video from "../models/Video.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Thiếu file video" });

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: "videos"
    });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    const video = await Video.create({
      title,
      description,
      url: result.secure_url,
      thumbnail: result.secure_url.replace(".mp4", ".jpg"),
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Không tìm thấy video" });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xoá video" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchVideos = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const videos = await Video.find({
      title: { $regex: q, $options: 'i' }
    }).sort({ createdAt: -1 });

    res.json({
      total: videos.length,
      videos: videos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRandomVideos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    // Lấy video ngẫu nhiên
    const videos = await Video.aggregate([
      { $sample: { size: limit } }
    ]);
    
    res.json({
      total: videos.length,
      videos: videos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLatestVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    res.json({
      total: videos.length,
      videos: videos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

