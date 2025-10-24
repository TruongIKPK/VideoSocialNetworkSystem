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

    res.status(201).json({
      _id: comment._id,
      text: comment.text,
      videoId: comment.videoId,
      userId: comment.userId,
      createdAt: comment.createdAt,
      parentId: comment.parentId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByVideo = async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });

    const result = comments.map(c => ({
      _id: c._id,
      text: c.text,
      videoId: c.videoId,
      userId: c.userId,
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