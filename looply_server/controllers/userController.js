import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary, { configureCloudinary } from "../config/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email đã được sử dụng" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashed });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Kiểm tra trạng thái tài khoản
    if (user.status === "locked") {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa",
        code: "ACCOUNT_LOCKED"
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Sai mật khẩu" });

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Trả về user và token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role || "user",
        status: user.status || "active",
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    configureCloudinary();
    
    const { id } = req.params;
    const { name, bio } = req.body;
    const file = req.file;

    let avatarUrl = null;

    if (file) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
        folder: "avatars",
        transformation: [
          { 
            width: 200, 
            height: 200, 
            crop: "fill",         
            gravity: "face"        
          },
          { 
            quality: "auto",      
            format: "webp"         
          }
        ]
      });
      avatarUrl = result.secure_url;
    }

    const updateData = { name, bio };
    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password"); 

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[getUserById] 🔍 Looking for user with ID:`, id);
    console.log(`[getUserById] 📋 ID type:`, typeof id);
    console.log(`[getUserById] 📋 ID length:`, id?.length);
    
    // Validate ID format
    if (!id || id.trim() === '') {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    
    // Try multiple methods to find user
    let user = null;
    
    // Method 1: Try findById (standard MongoDB method)
    try {
      user = await User.findById(id).select("-password");
      if (user) {
        console.log(`[getUserById] ✅ User found with findById`);
      }
    } catch (findByIdError) {
      console.log(`[getUserById] ⚠️ findById failed:`, findByIdError.message);
    }
    
    // Method 2: Try findOne with _id as string
    if (!user) {
      try {
        console.log(`[getUserById] 🔄 Trying findOne with _id as string`);
        user = await User.findOne({ _id: id }).select("-password");
        if (user) {
          console.log(`[getUserById] ✅ User found with findOne(_id)`);
        }
      } catch (findOneError) {
        console.log(`[getUserById] ⚠️ findOne failed:`, findOneError.message);
      }
    }
    
    // Method 3: Try with mongoose.Types.ObjectId if ID is valid ObjectId format
    if (!user) {
      try {
        const mongoose = (await import("mongoose")).default;
        if (mongoose.Types.ObjectId.isValid(id)) {
          const objectId = new mongoose.Types.ObjectId(id);
          console.log(`[getUserById] 🔄 Trying findById with ObjectId conversion`);
          user = await User.findById(objectId).select("-password");
          if (user) {
            console.log(`[getUserById] ✅ User found with ObjectId conversion`);
          }
        }
      } catch (objectIdError) {
        console.log(`[getUserById] ⚠️ ObjectId conversion failed:`, objectIdError.message);
      }
    }
    
    // Method 4: Debug - Get all users and check manually (for debugging only)
    if (!user) {
      console.log(`[getUserById] 🔍 Debug: Checking all users in database`);
      const allUsers = await User.find().select("_id name username").limit(5);
      console.log(`[getUserById] 📊 Sample users in DB:`, allUsers.map(u => ({
        _id: u._id.toString(),
        _idType: typeof u._id,
        name: u.name
      })));
      
      // Try to find by string comparison
      const foundUser = allUsers.find(u => u._id.toString() === id);
      if (foundUser) {
        console.log(`[getUserById] ✅ User found by string comparison`);
        user = await User.findById(foundUser._id).select("-password");
      }
    }
    
    if (!user) {
      console.log(`[getUserById] ❌ User not found with ID:`, id);
      console.log(`[getUserById] ❌ Tried all methods: findById, findOne, ObjectId conversion, string comparison`);
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    
    console.log(`[getUserById] ✅ User found:`, {
      id: user._id.toString(),
      name: user.name,
      username: user.username
    });
    
    res.json(user);
  } catch (error) {
    console.error(`[getUserById] ❌ Error:`, error);
    // If it's a CastError (invalid ObjectId), return 400 instead of 500
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }


    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    }).select("-password");

    res.json({
      total: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const { id } = req.params; // ID của người được follow
    const currentUserId = req.user._id.toString(); // Lấy từ req.user._id thay vì req.user.userId

    // Không thể follow chính mình
    if (id === currentUserId) {
      return res.status(400).json({ message: "Không thể follow chính mình" });
    }

    // Fetch user hiện tại từ DB để có followingList đầy đủ
    const currentUser = await User.findById(currentUserId).select("followingList following");
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng hiện tại" });
    }

    // Kiểm tra user được follow tồn tại
    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra đã follow chưa - convert id sang string để so sánh chính xác
    const idString = id.toString();
    const currentUserIdString = currentUserId.toString();
    
    // Kiểm tra trong followingList của currentUser
    const isAlreadyFollowing = currentUser.followingList && currentUser.followingList.length > 0
      ? currentUser.followingList.some(
          (followedId) => {
            const followedIdString = followedId ? (followedId.toString ? followedId.toString() : String(followedId)) : '';
            return followedIdString === idString;
          }
        )
      : false;

    if (isAlreadyFollowing) {
      return res.status(400).json({ 
        message: "Bạn đã follow người dùng này rồi. Vui lòng sử dụng chức năng unfollow để hủy follow.",
        code: "ALREADY_FOLLOWING"
      });
    }

    // Kiểm tra lại một lần nữa sau khi fetch để đảm bảo không có race condition
    const doubleCheckUser = await User.findById(currentUserId).select("followingList");
    const doubleCheckFollowing = doubleCheckUser.followingList && doubleCheckUser.followingList.length > 0
      ? doubleCheckUser.followingList.some(
          (followedId) => {
            const followedIdString = followedId ? (followedId.toString ? followedId.toString() : String(followedId)) : '';
            return followedIdString === idString;
          }
        )
      : false;

    if (doubleCheckFollowing) {
      return res.status(400).json({ 
        message: "Bạn đã follow người dùng này rồi. Vui lòng sử dụng chức năng unfollow để hủy follow.",
        code: "ALREADY_FOLLOWING"
      });
    }

    // Thêm vào followingList của user hiện tại và tăng following count
    // Sử dụng $addToSet để đảm bảo không có duplicate
    const updateCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      {
        $addToSet: { followingList: id }, // $addToSet tự động kiểm tra duplicate
        $inc: { following: 1 }
      },
      { new: true }
    );

    // Kiểm tra xem có thực sự thêm được không (nếu đã có thì $addToSet sẽ không thêm)
    const wasAdded = updateCurrentUser.followingList.some(
      (followedId) => {
        const followedIdString = followedId ? (followedId.toString ? followedId.toString() : String(followedId)) : '';
        return followedIdString === idString;
      }
    );

    if (!wasAdded) {
      // Nếu không thêm được (có thể do duplicate), rollback
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { following: -1 }
      });
      return res.status(400).json({ 
        message: "Bạn đã follow người dùng này rồi. Vui lòng sử dụng chức năng unfollow để hủy follow.",
        code: "ALREADY_FOLLOWING"
      });
    }

    // Thêm vào followersList của user được follow và tăng followers count
    await User.findByIdAndUpdate(id, {
      $addToSet: { followersList: currentUserId }, // $addToSet để tránh duplicate
      $inc: { followers: 1 }
    });

    res.json({ 
      message: "Follow thành công",
      following: (currentUser.following || 0) + 1
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params; // ID của người được unfollow
    const currentUserId = req.user._id.toString(); // Lấy từ req.user._id thay vì req.user.userId

    // Không thể unfollow chính mình
    if (id === currentUserId) {
      return res.status(400).json({ message: "Không thể unfollow chính mình" });
    }

    // Fetch user hiện tại từ DB để có followingList đầy đủ
    const currentUser = await User.findById(currentUserId).select("followingList following");
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng hiện tại" });
    }

    // Kiểm tra đã follow chưa - convert id sang string để so sánh chính xác
    const idString = id.toString();
    
    // Kiểm tra trong followingList của currentUser
    const isFollowing = currentUser.followingList && currentUser.followingList.length > 0
      ? currentUser.followingList.some(
          (followedId) => {
            const followedIdString = followedId ? (followedId.toString ? followedId.toString() : String(followedId)) : '';
            return followedIdString === idString;
          }
        )
      : false;

    if (!isFollowing) {
      return res.status(400).json({ 
        message: "Bạn chưa follow người dùng này. Vui lòng follow trước khi unfollow.",
        code: "NOT_FOLLOWING"
      });
    }

    // Xóa khỏi followingList của user hiện tại và giảm following count
    const updateResult = await User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: { followingList: id },
        $inc: { following: -1 }
      },
      { new: true }
    );

    // Xóa khỏi followersList của user được unfollow và giảm followers count
    await User.findByIdAndUpdate(id, {
      $pull: { followersList: currentUserId },
      $inc: { followers: -1 }
    });

    res.json({ 
      message: "Unfollow thành công",
      following: Math.max(0, (currentUser.following || 0) - 1)
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách followers
export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .populate('followersList', '-password')
      .select('followersList followers');
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      total: user.followers,
      followers: user.followersList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách following
export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .populate('followingList', '-password')
      .select('followingList following');
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      total: user.following,
      following: user.followingList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user info (including role)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    // Ensure role and status are included in response
    res.json({
      ...user.toObject(),
      role: user.role || "user",
      status: user.status || "active"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (public - để xem profile người khác)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm user theo ID, loại bỏ password
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra trạng thái tài khoản (nếu bị khóa, có thể ẩn một số thông tin)
    if (user.status === "locked") {
      return res.status(403).json({ 
        message: "Tài khoản này đã bị khóa",
        code: "ACCOUNT_LOCKED"
      });
    }

    // Trả về thông tin user
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      followers: user.followers || 0,
      following: user.following || 0,
      role: user.role || "user",
      status: user.status || "active",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    // Xử lý lỗi ObjectId không hợp lệ
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "locked"].includes(status)) {
      return res.status(400).json({ message: "Status phải là 'active' hoặc 'locked'" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật trạng thái thành công",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra xem user hiện tại đã follow user khác chưa
export const checkFollow = async (req, res) => {
  try {
    const { userId } = req.query; // ID của user được check follow
    const currentUserId = req.user._id.toString();

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId cần kiểm tra" });
    }

    // Lấy thông tin user hiện tại với followingList
    const currentUser = await User.findById(currentUserId).select("followingList");
    
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng hiện tại" });
    }

    // Kiểm tra xem userId có trong followingList không
    const isFollowing = currentUser.followingList.some(
      (id) => id.toString() === userId
    );

    res.json({
      isFollowing: isFollowing,
      followed: isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tổng số lượt like mà user nhận được từ các video của họ
export const getUserTotalLikes = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    // Import models
    const Video = (await import("../models/Video.js")).default;
    const Like = (await import("../models/Like.js")).default;

    // Lấy tất cả video của user
    const videos = await Video.find({ "user._id": userId }).select("_id");

    if (videos.length === 0) {
      return res.json({
        totalLikes: 0,
        videoCount: 0,
        videos: [],
      });
    }

    const videoIds = videos.map((video) => video._id);

    // Đếm tổng số lượt like từ các video của user
    const totalLikes = await Like.countDocuments({
      targetType: "video",
      targetId: { $in: videoIds },
    });

    // Lấy chi tiết từng video với số lượt like
    const videosWithLikes = await Promise.all(
      videos.map(async (video) => {
        const likesCount = await Like.countDocuments({
          targetType: "video",
          targetId: video._id,
        });
        return {
          videoId: video._id,
          likesCount: likesCount,
        };
      })
    );

    res.json({
      totalLikes: totalLikes,
      videoCount: videos.length,
      videos: videosWithLikes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
