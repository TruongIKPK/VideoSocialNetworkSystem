import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  count: { 
    type: Number, 
    default: 0 
  },
  trending: { 
    type: Boolean, 
    default: false 
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index để tìm kiếm nhanh
hashtagSchema.index({ name: 'text' });
hashtagSchema.index({ count: -1 });
hashtagSchema.index({ trending: 1, count: -1 });

export default mongoose.model("Hashtag", hashtagSchema);

