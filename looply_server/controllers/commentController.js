import Comment from "../models/Comment.js";
import Video from "../models/Video.js";

export const addComment = async (req, res) => {
  try {
    const { text, videoId, parentId } = req.body;
    const userId = req.user._id;

    const comment = await Comment.create({
      text,
      videoId,
      userId,
      parentId: parentId || null
    });

    await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });

    // Populate user info
    await comment.populate("userId", "name username avatar");
    
    res.status(201).json({
      _id: comment._id,
      text: comment.text,
      videoId: comment.videoId,
      userId: comment.userId ? {
        _id: comment.userId._id,
        name: comment.userId.name || comment.userId.username || "User",
        avatar: comment.userId.avatar || ""
      } : null,
      likesCount: comment.likesCount || 0,
      likedUsers: comment.likedUsers || [],
      createdAt: comment.createdAt,
      parentId: comment.parentId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id)
      .populate("userId", "name username avatar");

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Kiểm tra status - chỉ trả về comment active (trừ khi là admin)
    if (comment.status === "violation") {
      return res.status(404).json({ message: "Comment này đã bị vi phạm" });
    }

    res.json({
      _id: comment._id,
      text: comment.text,
      videoId: comment.videoId,
      userId: comment.userId ? {
        _id: comment.userId._id,
        name: comment.userId.name || comment.userId.username || "User",
        avatar: comment.userId.avatar || ""
      } : null,
      likesCount: comment.likesCount || 0,
      likedUsers: comment.likedUsers || [],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      parentId: comment.parentId,
      status: comment.status
    });
  } catch (error) {
    // Xử lý lỗi ObjectId không hợp lệ
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID comment không hợp lệ" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByVideo = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      videoId: req.params.videoId,
      status: { $ne: "violation" }
    })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 });

    const result = comments.map(c => ({
      _id: c._id,
      text: c.text,
      videoId: c.videoId,
      userId: c.userId ? {
        _id: c.userId._id,
        name: c.userId.name || c.userId.username || "User",
        avatar: c.userId.avatar || ""
      } : null,
      likesCount: c.likesCount || 0,
      likedUsers: c.likedUsers || [],
      createdAt: c.createdAt,
      parentId: c.parentId
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Kiểm tra đã like chưa
    if (comment.likedUsers.includes(userId)) {
      return res.status(400).json({ message: "Bạn đã like comment này rồi" });
    }

    comment.likesCount += 1;
    comment.likedUsers.push(userId);
    await comment.save();

    res.json({
      message: "Đã like comment",
      likesCount: comment.likesCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Kiểm tra đã like chưa
    if (!comment.likedUsers.includes(userId)) {
      return res.status(400).json({ message: "Bạn chưa like comment này" });
    }

    comment.likesCount = Math.max(0, comment.likesCount - 1);
    comment.likedUsers = comment.likedUsers.filter(
      (uid) => uid.toString() !== userId.toString()
    );
    await comment.save();

    res.json({
      message: "Đã unlike comment",
      likesCount: comment.likesCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update comment status (admin only)
export const updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "violation"].includes(status)) {
      return res.status(400).json({ message: "Status phải là 'active' hoặc 'violation'" });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    res.json({
      message: "Cập nhật trạng thái comment thành công",
      comment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};