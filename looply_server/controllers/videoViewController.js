// controllers/videoViewController.js
import VideoView from "../models/VideoView.js";
import Video from "../models/Video.js";
import { getApprovedVideosFilter } from "./videoController.js";

// Lưu lịch sử xem
export const recordVideoView = async (req, res) => {
  try {
    const { videoId, watchDuration, completed } = req.body;
    const userId = req.user.id;

    // Kiểm tra đã xem chưa
    let view = await VideoView.findOne({ userId, videoId });

    if (view) {
      // Cập nhật nếu đã xem
      view.watchDuration = Math.max(view.watchDuration, watchDuration);
      view.completed = completed || view.completed;
      view.viewedAt = new Date();
      await view.save();
    } else {
      // Tạo mới
      view = await VideoView.create({
        userId,
        videoId,
        watchDuration,
        completed
      });
    }

    res.json({ message: "Đã lưu lịch sử xem", view });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy 3 video đề xuất (chưa xem hoặc xem lâu rồi)
export const getRecommendedVideos = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 3;

    // Lấy danh sách video đã xem
    const viewedVideos = await VideoView.find({ userId })
      .select('videoId')
      .lean();
    
    const viewedVideoIds = viewedVideos.map(v => v.videoId);

    // Lấy video chưa xem, loại bỏ video flagged, rejected, và violation
    const approvedFilter = getApprovedVideosFilter();
    let videos = await Video.find({ 
      $and: [
        { _id: { $nin: viewedVideoIds } },
        approvedFilter
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Nếu không đủ video chưa xem, lấy thêm video đã xem cũ
    if (videos.length < limit) {
      const oldViewed = await VideoView.find({ userId })
        .sort({ viewedAt: 1 })
        .limit(limit - videos.length)
        .select('videoId')
        .lean();

      const oldVideoIds = oldViewed.map(v => v.videoId);
      
      // Lấy video đã xem cũ, nhưng vẫn loại bỏ video flagged, rejected, và violation
      const additionalVideos = await Video.find({ 
        $and: [
          { _id: { $in: oldVideoIds } },
          approvedFilter
        ]
      }).lean();

      videos = [...videos, ...additionalVideos];
    }

    // Thêm flag đã xem chưa
    const result = videos.map(video => ({
      ...video,
      isViewed: viewedVideoIds.some(id => id.toString() === video._id.toString())
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra video đã xem chưa
export const checkVideoViewed = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const view = await VideoView.findOne({ userId, videoId });

    res.json({
      isViewed: !!view,
      viewData: view || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy số lượt xem của một video
export const getVideoViewCount = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Validate videoId
    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }

    // Kiểm tra video có tồn tại không
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Đếm số lượt xem (số lượng unique users đã xem video)
    const viewCount = await VideoView.countDocuments({ videoId });

    // Đếm số lượt xem đã hoàn thành (completed = true)
    const completedCount = await VideoView.countDocuments({ 
      videoId, 
      completed: true 
    });

    res.json({
      videoId,
      viewCount,
      completedCount,
      message: "Success"
    });
  } catch (error) {
    console.error("Error getting video view count:", error);
    res.status(500).json({ message: error.message });
  }
};