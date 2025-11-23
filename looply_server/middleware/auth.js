import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Ensure role and status are included, và đảm bảo followingList/followersList là arrays
    req.user = {
      ...user.toObject(),
      role: user.role || "user",
      status: user.status || "active",
      followingList: user.followingList || [],
      followersList: user.followersList || [],
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Optional authentication middleware - không bắt buộc token, nhưng nếu có token thì sẽ set req.user
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      // Không có token thì tiếp tục, không set req.user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      
      if (user) {
        // Ensure role and status are included, và đảm bảo followingList/followersList là arrays
        req.user = {
          ...user.toObject(),
          role: user.role || "user",
          status: user.status || "active",
          followingList: user.followingList || [],
          followersList: user.followersList || [],
        };
      }
    } catch (tokenError) {
      // Token không hợp lệ nhưng không báo lỗi, chỉ tiếp tục không set req.user
      console.log("Optional auth: Invalid token, continuing without authentication");
    }
    
    next();
  } catch (error) {
    // Lỗi khác thì vẫn tiếp tục, không block request
    next();
  }
};

// Middleware check admin role
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required" });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Middleware optional authentication - không bắt buộc token, nhưng nếu có thì set req.user
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      // Không có token, tiếp tục nhưng không set req.user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      
      if (user) {
        req.user = {
          ...user.toObject(),
          role: user.role || "user",
          status: user.status || "active",
          followingList: user.followingList || [],
          followersList: user.followersList || [],
        };
        console.log(`[optionalAuth] ✅ User authenticated: ${user.username} (${user.role})`);
      }
    } catch (error) {
      // Token không hợp lệ, nhưng vẫn tiếp tục (không bắt buộc)
      console.log(`[optionalAuth] ⚠️ Invalid token, continuing without auth`);
    }
    
    next();
  } catch (error) {
    // Lỗi khác, vẫn tiếp tục
    next();
  }
};

// Middleware check owner (user chỉ có thể sửa profile của chính mình)
export const checkOwnership = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Access denied. You can only modify your own profile" });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Middleware check video ownership (user chỉ có thể xóa video của chính mình)
export const checkVideoOwnership = async (req, res, next) => {
  try {
    const Video = (await import("../models/Video.js")).default;
    const { id } = req.params;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    
    // Kiểm tra user là owner của video
    const videoOwnerId = video.user?._id?.toString() || video.user?._id;
    const userId = req.user._id.toString();
    
    if (videoOwnerId !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. You can only delete your own videos" });
    }
    
    // Attach video to request for use in controller
    req.video = video;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};