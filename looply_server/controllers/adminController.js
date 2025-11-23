import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Report from "../models/Report.js";
import VideoView from "../models/VideoView.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log("📊 getDashboardStats called");
    console.log("📊 Request path:", req.path);
    console.log("📊 Request originalUrl:", req.originalUrl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalVideos,
      totalReports,
      todayUsers,
      todayVideos,
      todayReports,
      activeUsers,
      lockedUsers,
      activeVideos,
      violationVideos,
      pendingReports,
      resolvedReports,
    ] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Report.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Video.countDocuments({ createdAt: { $gte: today } }),
      Report.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "locked" }),
      Video.countDocuments({ status: "active" }),
      Video.countDocuments({ status: "violation" }),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "resolved" }),
    ]);

    res.json({
      total: {
        users: totalUsers,
        videos: totalVideos,
        reports: totalReports,
      },
      today: {
        users: todayUsers,
        videos: todayVideos,
        reports: todayReports,
      },
      users: {
        active: activeUsers,
        locked: lockedUsers,
      },
      videos: {
        active: activeVideos,
        violation: violationVideos,
      },
      reports: {
        pending: pendingReports,
        resolved: resolvedReports,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    if (status && ["active", "locked"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status (lock/unlock)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "locked"].includes(status)) {
      return res.status(400).json({
        message: "Status phải là 'active' hoặc 'locked'",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      message: `Người dùng đã được ${status === "locked" ? "khóa" : "mở khóa"}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get video by ID (admin only - includes violation videos)
export const getVideoById = async (req, res) => {
  try {
    console.log("📹 getVideoById controller called");
    console.log("📹 Video ID:", req.params.videoId);
    const { videoId } = req.params;

    const video = await Video.findById(videoId).lean();
    
    if (!video) {
      console.log("❌ Video not found:", videoId);
      return res.status(404).json({ message: "Không tìm thấy video" });
    }

    // Add views count
    const viewsCount = await VideoView.countDocuments({ videoId: video._id });
    
    // Ensure user data is populated
    let userData = video.user;
    if (video.user?._id && (!video.user.name || !video.user.avatar)) {
      const fullUser = await User.findById(video.user._id).select("name username avatar").lean();
      if (fullUser) {
        userData = {
          _id: fullUser._id,
          name: fullUser.name || video.user.name,
          username: fullUser.username,
          avatar: fullUser.avatar || video.user.avatar,
        };
      }
    }

    const videoWithStats = {
      ...video,
      views: viewsCount,
      user: userData,
    };

    console.log("✅ Video found:", videoWithStats._id);
    res.json(videoWithStats);
  } catch (error) {
    console.error("❌ Error fetching video:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all videos (admin only - includes violation videos)
export const getAllVideos = async (req, res) => {
  try {
    console.log("📹 getAllVideos controller called");
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (status && ["active", "violation"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Video.countDocuments(query);

    // Add views count and ensure user data is populated for each video
    const videosWithViews = await Promise.all(
      videos.map(async (video) => {
        const viewsCount = await VideoView.countDocuments({ videoId: video._id });
        
        // If user._id exists but user data is incomplete, fetch from User model
        let userData = video.user;
        if (video.user?._id && (!video.user.name || !video.user.avatar)) {
          const fullUser = await User.findById(video.user._id).select("name username avatar").lean();
          if (fullUser) {
            userData = {
              _id: fullUser._id,
              name: fullUser.name || video.user.name,
              username: fullUser.username,
              avatar: fullUser.avatar || video.user.avatar,
            };
          }
        }
        
        return {
          ...video,
          views: viewsCount,
          user: userData,
        };
      })
    );

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      videos: videosWithViews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update video status (mark as violation)
// Khi video được đánh dấu vi phạm, nó sẽ tự động bị ẩn khỏi tất cả danh sách video của user
// vì tất cả các route lấy video đều filter: status: { $ne: "violation" }
export const updateVideoStatus = async (req, res) => {
  try {
    console.log("🎬 updateVideoStatus controller called");
    console.log("🎬 Video ID:", req.params.videoId);
    console.log("🎬 Request body:", req.body);
    const { videoId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "violation"].includes(status)) {
      return res.status(400).json({
        message: "Status phải là 'active' hoặc 'violation'",
      });
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      { status },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video" });
    }

    console.log("✅ Video status updated successfully:", video._id, "->", status);
    
    // Log nghiệp vụ: Khi video được đánh dấu vi phạm, nó sẽ tự động bị ẩn
    if (status === "violation") {
      console.log("🚫 Video vi phạm sẽ bị ẩn khỏi tất cả danh sách video của user");
      console.log("🚫 Video sẽ không hiển thị trong:");
      console.log("   - Danh sách video chung (getAllVideos)");
      console.log("   - Danh sách video của user (getVideosByUserId)");
      console.log("   - Danh sách video đã thích (getLikedVideosByUserId)");
      console.log("   - Danh sách video đã lưu (getSavedVideosByUserId)");
      console.log("   - Video ngẫu nhiên (getRandomVideos)");
      console.log("   - Video mới nhất (getLatestVideos)");
      console.log("   - Kết quả tìm kiếm (searchVideos, searchVideosByHashtags)");
    }
    
    res.json({
      message: `Video đã được đánh dấu là ${status === "violation" ? "vi phạm" : "hoạt động"}. ${status === "violation" ? "Video sẽ bị ẩn khỏi tất cả danh sách video của user." : ""}`,
      video,
    });
  } catch (error) {
    console.error("❌ Error updating video status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all comments (admin only - includes violation comments)
export const getAllComments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, videoId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (status && ["active", "violation"].includes(status)) {
      query.status = status;
    }

    if (videoId) {
      query.videoId = videoId;
    }

    const comments = await Comment.find(query)
      .populate("userId", "name username avatar")
      .populate("videoId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      comments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update comment status (mark as violation)
export const updateCommentStatus = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "violation"].includes(status)) {
      return res.status(400).json({
        message: "Status phải là 'active' hoặc 'violation'",
      });
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { status },
      { new: true }
    )
      .populate("userId", "name username avatar")
      .populate("videoId", "title");

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    res.json({
      message: `Comment đã được đánh dấu là ${status === "violation" ? "vi phạm" : "hoạt động"}`,
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment (admin only)
export const deleteComment = async (req, res) => {
  try {
    console.log("🗑️ deleteComment controller called");
    console.log("🗑️ Comment ID:", req.params.commentId);
    const { commentId } = req.params;

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    console.log("✅ Comment deleted successfully:", commentId);
    res.json({
      message: "Comment đã được xóa thành công",
      commentId: commentId,
    });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent videos for admin dashboard
export const getRecentVideos = async (req, res) => {
  try {
    console.log("📹 getRecentVideos called");
    const limit = parseInt(req.query.limit) || 10;

    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Manually populate user info if needed
    const videosWithUser = await Promise.all(
      videos.map(async (video) => {
        if (video.user?._id) {
          const user = await User.findById(video.user._id).select("name username avatar").lean();
          return {
            ...video,
            user: user ? {
              _id: user._id,
              name: user.name || video.user.name,
              username: user.username,
              avatar: user.avatar || video.user.avatar,
            } : video.user,
          };
        }
        return video;
      })
    );

    res.json({ videos: videosWithUser });
  } catch (error) {
    console.error("Error fetching recent videos:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent reports for admin dashboard
export const getRecentReports = async (req, res) => {
  try {
    console.log("🚩 getRecentReports called");
    console.log("🚩 Query params:", req.query);
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type; // Optional: filter by type (video, user, comment)

    // Build query
    let query = {};
    if (type && ["user", "video", "comment"].includes(type)) {
      query.reportedType = type;
    }

    const reports = await Report.find(query)
      .populate("reporterId", "name username avatar")
      .populate("resolvedBy", "name username")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(`🚩 Found ${reports.length} reports${type ? ` (type: ${type})` : ""}`);
    console.log("🚩 Reports sample:", reports.slice(0, 2).map(r => ({
      _id: r._id,
      reportedType: r.reportedType,
      status: r.status,
      createdAt: r.createdAt
    })));

    res.json({ reports });
  } catch (error) {
    console.error("❌ Error fetching recent reports:", error);
    res.status(500).json({ message: error.message });
  }
};

