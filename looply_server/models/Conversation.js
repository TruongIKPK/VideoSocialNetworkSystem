import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export const createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body; // user muốn chat cùng
    const currentUserId = req.user._id;

    // Tìm conversation giữa 2 user
    let conversation = await Conversation.findOne({
      members: { $all: [currentUserId, userId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({ members: [currentUserId, userId] });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default mongoose.model("Conversation", conversationSchema);