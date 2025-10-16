import Comment from "../models/Comment.js";
import Video from "../models/Video.js";

export const addComment = async (req, res) => {
  try {
    const { text, userId, videoId, name, avatar } = req.body;

    const comment = await Comment.create({
      text,
      video: videoId,
      user: { _id: userId, name, avatar }
    });

    await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByVideo = async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.videoId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
