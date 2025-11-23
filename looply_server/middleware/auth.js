import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  try {
    console.log(`[authenticateToken] Checking auth for: ${req.method} ${req.path}`);
    console.log(`[authenticateToken] Original URL: ${req.originalUrl}`);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      console.log(`[authenticateToken] ❌ No token provided, returning 401`);
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      console.log(`[authenticateToken] ❌ User not found, returning 401`);
      return res.status(401).json({ message: "Invalid token" });
    }
    
    console.log(`[authenticateToken] ✅ User authenticated: ${user.username} (${user.role})`);

    // Populate role and status into req.user, và đảm bảo followingList/followersList là arrays
    req.user = {
      ...user.toObject(),
      role: user.role || "user",
      status: user.status || "active",
      followingList: user.followingList || [],
      followersList: user.followersList || [],
    };
    next();
  } catch (error) {
    console.error(`[authenticateToken] ❌ Error:`, error.message);
    return res.status(403).json({ message: "Invalid or expired token", error: error.message });
  }
};

// Middleware check admin role
export const requireAdmin = (req, res, next) => {
  try {
    console.log(`[requireAdmin] Checking admin access for: ${req.method} ${req.path}`);
    if (!req.user) {
      console.log(`[requireAdmin] ❌ No user found, returning 401`);
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log(`[requireAdmin] User role: ${req.user.role}`);
    if (req.user.role !== "admin") {
      console.log(`[requireAdmin] ❌ User is not admin (role: ${req.user.role}), returning 403`);
      return res.status(403).json({ 
        message: "Access denied. Admin role required",
        userRole: req.user.role 
      });
    }
    
    console.log(`[requireAdmin] ✅ Admin access granted, proceeding to route handler`);
    next();
  } catch (error) {
    console.error(`[requireAdmin] ❌ Error:`, error);
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