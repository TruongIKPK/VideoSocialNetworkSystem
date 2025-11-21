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

<<<<<<< HEAD
    // Populate role and status into req.user
=======
    // Ensure role and status are included, và đảm bảo followingList/followersList là arrays
>>>>>>> df4026aa05bbbe506caa98460e56412567405776
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