import Save from "../models/Save.js";
import Video from "../models/Video.js";

// Save video
export const saveVideo = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.user._id.toString(); // Lấy từ token

    if (!videoId) {
      return res.status(400).json({ message: "Thiếu videoId" });
    }

    // Kiểm tra video tồn tại
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video không tồn tại" });
    }

    // Kiểm tra đã save chưa
    const existing = await Save.findOne({ user: userId, videoId });
    if (existing) {
      return res.status(400).json({ message: "Đã lưu video này rồi" });
    }

    // Tạo save mới
    await Save.create({ user: userId, videoId });

    // Cập nhật savesCount trong Video
    await Video.findByIdAndUpdate(videoId, { $inc: { savesCount: 1 } });

    res.json({ message: "Đã lưu video" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unsave video
export const unsaveVideo = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.user._id.toString(); // Lấy từ token

    if (!videoId) {
      return res.status(400).json({ message: "Thiếu videoId" });
    }

    // Xóa save
    const save = await Save.findOneAndDelete({ user: userId, videoId });
    if (!save) {
      return res.status(404).json({ message: "Chưa lưu video này" });
    }

    // Giảm savesCount trong Video
    await Video.findByIdAndUpdate(videoId, { $inc: { savesCount: -1 } });

    res.json({ message: "Đã bỏ lưu video" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra xem user đã save video chưa
export const checkSave = async (req, res) => {
  try {
    const { userId, videoId } = req.query;

    if (!userId || !videoId) {
      return res.status(400).json({ message: "Thiếu userId hoặc videoId" });
    }

    const save = await Save.findOne({ user: userId, videoId });

    res.json({
      isSaved: !!save,
      saved: !!save,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách video đã save của user
export const getSavedVideos = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const saves = await Save.find({ user: userId })
      .populate("videoId")
      .sort({ createdAt: -1 });

    const videos = saves.map((save) => save.videoId).filter(Boolean);

    res.json({
      total: videos.length,
      videos: videos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

