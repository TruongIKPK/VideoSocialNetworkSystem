import Video from "../models/Video.js";
import User from "../models/User.js";
import VideoView from "../models/VideoView.js";
import Like from "../models/Like.js";
import Save from "../models/Save.js";
import Comment from "../models/Comment.js";
import cloudinary, { configureCloudinary, getPublicIdFromUrl, generateThumbnailUrl } from "../config/cloudinary.js";
import { uploadVideoToS3 } from "../services/s3Service.js";
import { startContentModeration } from "../services/rekognitionService.js";
import fs from "fs";

export const uploadVideo = async (req, res) => {
  try {
    configureCloudinary();
    const { title, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Thiếu file video" });

    // Sử dụng userId từ req.user (đã được set bởi authenticateToken middleware)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Không tìm thấy thông tin user" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    // Step 1: Upload to Cloudinary as private (authenticated access)
    const cloudinaryResult = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: "videos",
      access_mode: "authenticated", // Private access
    });

    // Step 2: Generate thumbnail URL using Cloudinary transformation
    const thumbnailUrl = generateThumbnailUrl(
      cloudinaryResult.secure_url,
      cloudinaryResult.public_id,
      { width: 320, height: 240, offset: 1 }
    );

    // Step 3: Create video record with pending moderation status
    const video = await Video.create({
      title,
      description,
      url: cloudinaryResult.secure_url,
      thumbnail: thumbnailUrl || cloudinaryResult.secure_url, // Fallback to video URL if thumbnail generation fails
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryTempUrl: cloudinaryResult.secure_url,
      moderationStatus: "pending",
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      }
    });

    // Step 3: Upload to S3 as private (for Rekognition)
    // Only upload to S3 if file still exists
    const s3Key = `${userId}/${video._id}.mp4`;
    if (fs.existsSync(file.path)) {
      const uploadedS3Key = await uploadVideoToS3(file.path, s3Key);
      if (uploadedS3Key) {
        video.s3Key = uploadedS3Key;
        await video.save();
      }
      // If uploadVideoToS3 returns null, it means S3 is not configured or upload failed
      // Continue without S3 - video is still saved to Cloudinary
    } else {
      console.warn(`File not found for S3 upload: ${file.path}. Skipping S3 upload.`);
    }

    // Step 4: Start Rekognition moderation job
    if (video.s3Key) {
      try {
        const jobId = await startContentModeration(video.s3Key);
        video.rekognitionJobId = jobId;
        await video.save();
      } catch (rekognitionError) {
        console.error("Error starting Rekognition job:", rekognitionError);
        // Continue even if Rekognition fails - video is still saved
      }
    }

    // Clean up temporary file (only if it exists)
    if (fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log(`Temporary file deleted: ${file.path}`);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError.message || unlinkError);
      }
    }

    // Step 5: Return immediate response with pending status
    res.status(201).json({
      ...video.toObject(),
      message: "Video đang được kiểm duyệt. Bạn sẽ được thông báo khi video được duyệt."
    });
  } catch (error) {
    console.error("Upload video error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    // Only show approved videos and videos with old status system
    const videos = await Video.find({ 
      $or: [
        { moderationStatus: "approved" },
        { moderationStatus: { $exists: false } }, // Backward compatibility
        { status: { $ne: "violation" }, moderationStatus: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Không tìm thấy video" });
    
    // Check moderation status
    if (video.moderationStatus === "rejected" || video.moderationStatus === "flagged") {
      return res.status(403).json({ 
        message: "Video này đang chờ kiểm duyệt hoặc đã bị từ chối",
        moderationStatus: video.moderationStatus
      });
    }
    
    // Backward compatibility with old status field
    if (video.status === "violation" && !video.moderationStatus) {
      return res.status(403).json({ message: "Video này đã bị vi phạm" });
    }
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = req.video; // Video đã được kiểm tra ownership trong middleware
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // 1. Xóa video từ Cloudinary nếu có cloudinaryPublicId
    if (video.cloudinaryPublicId) {
      try {
        configureCloudinary();
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
          resource_type: "video"
        });
        console.log(`[DeleteVideo] ✅ Deleted video from Cloudinary: ${video.cloudinaryPublicId}`);
      } catch (cloudinaryError) {
        console.error(`[DeleteVideo] ⚠️ Error deleting from Cloudinary:`, cloudinaryError);
        // Tiếp tục xóa dù Cloudinary có lỗi
      }
    }

    // 2. Thumbnail không cần xóa vì nó được tạo động từ video URL
    // Thumbnail URL được generate từ video public ID, không phải file riêng
    // Khi video bị xóa, thumbnail URL sẽ tự động không còn hoạt động

    // 3. Xóa tất cả likes liên quan đến video
    await Like.deleteMany({ 
      targetType: "video", 
      targetId: videoId 
    });

    // 4. Xóa tất cả comments liên quan đến video
    await Comment.deleteMany({ videoId: videoId });

    // 5. Xóa tất cả saves liên quan đến video
    await Save.deleteMany({ videoId: videoId });

    // 6. Xóa tất cả video views liên quan đến video
    await VideoView.deleteMany({ videoId: videoId });

    // 7. Xóa video từ database
    await Video.findByIdAndDelete(videoId);

    console.log(`[DeleteVideo] ✅ Successfully deleted video: ${videoId}`);
    res.json({ message: "Đã xoá video thành công" });
  } catch (error) {
    console.error("[DeleteVideo] ❌ Error deleting video:", error);
    res.status(500).json({ message: error.message || "Lỗi khi xóa video" });
  }
};

export const searchVideos = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    // Tìm kiếm trong cả title và description, loại bỏ video vi phạm
    const videos = await Video.find({
      $and: [
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        },
        {
          $or: [
            { moderationStatus: "approved" },
            { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
          ]
        }
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
    
    // Lấy video ngẫu nhiên, loại bỏ video vi phạm
    const videos = await Video.aggregate([
      { 
        $match: { 
          $or: [
            { moderationStatus: "approved" },
            { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
          ]
        } 
      },
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
    const videos = await Video.find({ 
      $or: [
        { moderationStatus: "approved" },
        { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
      ]
    })
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

// Tìm kiếm video theo hashtags trong description
export const searchVideosByHashtags = async (req, res) => {
  try {
    const { hashtag, hashtags } = req.query;
    
    // Hỗ trợ cả hashtag (đơn) và hashtags (nhiều, phân cách bằng dấu phẩy)
    let searchTags = [];
    
    if (hashtags) {
      // Nếu có nhiều hashtags, tách bằng dấu phẩy
      searchTags = hashtags.split(',').map(tag => tag.trim().replace(/^#/, ''));
    } else if (hashtag) {
      // Nếu chỉ có một hashtag
      searchTags = [hashtag.trim().replace(/^#/, '')];
    } else {
      return res.status(400).json({ message: "Thiếu hashtag hoặc hashtags" });
    }

    // Loại bỏ các tag rỗng
    searchTags = searchTags.filter(tag => tag.length > 0);

    if (searchTags.length === 0) {
      return res.status(400).json({ message: "Hashtag không hợp lệ" });
    }

    // Tìm kiếm video có description chứa các hashtags
    // Sử dụng regex để tìm các hashtag trong description
    let videos = [];
    
    if (searchTags.length === 1) {
      // Nếu chỉ có một hashtag, dùng regex đơn giản
      const tag = searchTags[0];
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = new RegExp(`#${escapedTag}(?=\\s|,|$|\\s)`, 'i');
      
      videos = await Video.find({
        description: { $regex: regexPattern },
        $or: [
          { moderationStatus: "approved" },
          { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // Nếu có nhiều hashtags, tìm video chứa TẤT CẢ các hashtags
      // Tạo regex pattern cho mỗi hashtag và dùng $and
      const regexConditions = searchTags.map(tag => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return { description: { $regex: new RegExp(`#${escapedTag}(?=\\s|,|$|\\s)`, 'i') } };
      });
      
      videos = await Video.find({
        $and: [
          ...regexConditions,
          {
            $or: [
              { moderationStatus: "approved" },
              { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
            ]
          }
        ]
      }).sort({ createdAt: -1 });
    }

    res.json({
      total: videos.length,
      hashtags: searchTags,
      videos: videos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update video status (admin only)
export const updateVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "violation"].includes(status)) {
      return res.status(400).json({ message: "Status phải là 'active' hoặc 'violation'" });
    }

    const video = await Video.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video" });
    }

    res.json({
      message: "Cập nhật trạng thái video thành công",
      video
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách video theo userId (người dùng đăng tải)
export const getVideosByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    // Tìm tất cả video do user này đăng tải, loại bỏ video vi phạm
    const videos = await Video.find({
      "user._id": userId,
      $or: [
        { moderationStatus: "approved" },
        { moderationStatus: "pending" }, // Show pending videos to owner
        { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy thống kê views, likes, comments cho từng video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });
        const comments = await Comment.countDocuments({ videoId: video._id });

        return {
          ...video,
          views: views,
          likes: likes,
          comments: comments
        };
      })
    );

    res.json({
      total: videosWithStats.length,
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Get videos by userId error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách video người dùng đã thích
export const getLikedVideosByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    // Tìm tất cả like của user này cho video
    const likes = await Like.find({
      user: userId,
      targetType: "video"
    })
      .sort({ createdAt: -1 })
      .lean();

    const videoIds = likes.map(like => like.targetId);

    if (videoIds.length === 0) {
      return res.json({
        total: 0,
        videos: []
      });
    }

    // Lấy thông tin video, loại bỏ video vi phạm
    const videos = await Video.find({
      _id: { $in: videoIds },
      $or: [
        { moderationStatus: "approved" },
        { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy thống kê views, likes, comments cho từng video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });
        const comments = await Comment.countDocuments({ videoId: video._id });

        return {
          ...video,
          views: views,
          likes: likes,
          comments: comments
        };
      })
    );

    res.json({
      total: videosWithStats.length,
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Get liked videos by userId error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách video người dùng đã save
export const getSavedVideosByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    // Tìm tất cả save của user này
    const saves = await Save.find({
      user: userId
    })
      .sort({ createdAt: -1 })
      .lean();

    const videoIds = saves.map(save => save.videoId);

    if (videoIds.length === 0) {
      return res.json({
        total: 0,
        videos: []
      });
    }

    // Lấy thông tin video, loại bỏ video vi phạm
    const videos = await Video.find({
      _id: { $in: videoIds },
      $or: [
        { moderationStatus: "approved" },
        { moderationStatus: { $exists: false }, status: { $ne: "violation" } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy thống kê views, likes, comments cho từng video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });
        const comments = await Comment.countDocuments({ videoId: video._id });

        return {
          ...video,
          views: views,
          likes: likes,
          comments: comments
        };
      })
    );

    res.json({
      total: videosWithStats.length,
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Get saved videos by userId error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin Review Endpoints

/**
 * Get pending moderation videos (flagged, rejected, or pending)
 * Admin only
 */
export const getPendingModerationVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      moderationStatus: { $in: ["flagged", "rejected", "pending"] }
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      total: videos.length,
      videos: videos
    });
  } catch (error) {
    console.error("Get pending moderation videos error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get flagged or rejected videos only (excludes pending)
 * Admin only
 */
export const getFlaggedOrRejectedVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build query - only flagged or rejected
    const query = {
      moderationStatus: { $in: ["flagged", "rejected"] }
    };

    // Optional: filter by specific status if provided
    if (status && (status === "flagged" || status === "rejected")) {
      query.moderationStatus = status;
    }

    // Get total count for pagination
    const total = await Video.countDocuments(query);

    // Get videos with pagination
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Get additional stats for each video
    const videosWithStats = await Promise.all(
      videos.map(async (video) => {
        const views = await VideoView.countDocuments({ videoId: video._id });
        const likes = await Like.countDocuments({ 
          targetType: "video", 
          targetId: video._id 
        });
        const comments = await Comment.countDocuments({ videoId: video._id });

        return {
          ...video,
          views: views,
          likes: likes,
          comments: comments
        };
      })
    );

    res.json({
      total: total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      videos: videosWithStats
    });
  } catch (error) {
    console.error("Get flagged or rejected videos error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin approve a flagged/rejected video
 * Admin only
 */
export const approveVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Không tìm thấy video" });
    }

    // Make Cloudinary video public
    if (video.cloudinaryPublicId) {
      try {
        const { makeVideoPublic } = await import("../config/cloudinary.js");
        await makeVideoPublic(video.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Error making video public:", cloudinaryError);
      }
    }

    // Update video status and regenerate thumbnail URL
    video.moderationStatus = "approved";
    video.url = video.cloudinaryTempUrl || video.url;
    
    // Regenerate thumbnail URL using the updated video URL
    if (video.url && video.cloudinaryPublicId) {
      const newThumbnailUrl = generateThumbnailUrl(
        video.url,
        video.cloudinaryPublicId,
        { width: 320, height: 240, offset: 1 }
      );
      if (newThumbnailUrl) {
        video.thumbnail = newThumbnailUrl;
      }
    }
    
    await video.save();

    res.json({
      message: "Video đã được duyệt thành công",
      video: video
    });
  } catch (error) {
    console.error("Approve video error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin reject a video
 * Admin only
 */
export const rejectVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      return res.status(404).json({ message: "Không tìm thấy video" });
    }

    const video = await Video.findByIdAndUpdate(
      id,
      {
        moderationStatus: "rejected",
        moderationResults: {
          ...(existingVideo.moderationResults || {}),
          adminRejection: {
            reason: reason || "Video không phù hợp với quy định cộng đồng",
            rejectedAt: new Date(),
            rejectedBy: req.user?._id || req.user?.id
          }
        }
      },
      { new: true }
    );

    res.json({
      message: "Video đã bị từ chối",
      video: video
    });
  } catch (error) {
    console.error("Reject video error:", error);
    res.status(500).json({ message: error.message });
  }
};
