import Hashtag from "../models/Hashtag.js";

/**
 * Tìm kiếm hashtag
 */
export const searchHashtags = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const hashtags = await Hashtag.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ count: -1 }).limit(50);

    res.json({
      total: hashtags.length,
      hashtags: hashtags
    });
  } catch (error) {
    console.error("Search hashtags error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Lấy hashtag thịnh hành
 */
export const getTrendingHashtags = async (req, res) => {
  try {
    // Lấy top 20 hashtag có count cao nhất và được sử dụng trong 7 ngày qua
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const hashtags = await Hashtag.find({
      $or: [
        { lastUsed: { $gte: sevenDaysAgo } },
        { trending: true }
      ],
      count: { $gt: 0 }
    })
    .sort({ count: -1 })
    .limit(20);

    // Đánh dấu trending = true cho các hashtag này
    const hashtagsWithTrending = hashtags.map(hashtag => ({
      ...hashtag.toObject(),
      trending: true
    }));

    res.json({
      total: hashtagsWithTrending.length,
      hashtags: hashtagsWithTrending
    });
  } catch (error) {
    console.error("Get trending hashtags error:", error);
    // Nếu không có hashtag nào, trả về empty array
    res.json({
      total: 0,
      hashtags: []
    });
  }
};

/**
 * Tạo hoặc cập nhật hashtag (helper function)
 */
export const createOrUpdateHashtag = async (hashtagName) => {
  try {
    const name = hashtagName.toLowerCase().trim().replace(/^#/, '');
    
    const hashtag = await Hashtag.findOneAndUpdate(
      { name },
      { 
        $inc: { count: 1 },
        $set: { lastUsed: new Date() }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return hashtag;
  } catch (error) {
    console.error("Create or update hashtag error:", error);
    throw error;
  }
};

/**
 * Lấy tất cả hashtag
 */
export const getAllHashtags = async (req, res) => {
  try {
    const hashtags = await Hashtag.find()
      .sort({ count: -1 })
      .limit(100);

    res.json({
      total: hashtags.length,
      hashtags: hashtags
    });
  } catch (error) {
    console.error("Get all hashtags error:", error);
    res.status(500).json({ message: error.message });
  }
};

