import Video from "../models/Video.js";
import User from "../models/User.js";
import VideoView from "../models/VideoView.js";
import Like from "../models/Like.js";
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

    // Tìm kiếm trong cả title và description
    const videos = await Video.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    // Lấy thông tin views và likes cho từng video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });

        return {
          _id: video._id,
          title: video.title,
          description: video.description || "",
          url: video.url,
          thumbnail: video.thumbnail || video.url,
          author: video.user, // Map user to author for frontend
          createdAt: video.createdAt,
          views: views,
          likes: likes
        };
      })
    );

    res.json({
      total: videosWithStats.length,
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Search videos error:", error);
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

export const searchVideosByHashtags = async (req, res) => {
  try {
    const { hashtags } = req.query;
    
    if (!hashtags) {
      return res.status(400).json({ message: "Thiếu hashtag" });
    }

    // Tìm kiếm video có chứa hashtag trong description
    // Hashtag có thể ở dạng: #hashtag hoặc hashtag
    const hashtagPattern = hashtags.startsWith('#') ? hashtags : `#${hashtags}`;
    
    const videos = await Video.find({
      $or: [
        { description: { $regex: hashtagPattern, $options: 'i' } },
        { title: { $regex: hashtagPattern, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    // Lấy thông tin views và likes cho từng video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });

        return {
          _id: video._id,
          title: video.title,
          description: video.description || "",
          url: video.url,
          thumbnail: video.thumbnail || video.url,
          author: video.user, // Map user to author for frontend
          createdAt: video.createdAt,
          views: views,
          likes: likes
        };
      })
    );

    res.json({
      total: videosWithStats.length,
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Search videos by hashtags error:", error);
    res.status(500).json({ message: error.message });
  }
};

