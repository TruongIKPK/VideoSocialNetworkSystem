// MongoDB initialization script for video social network
db = db.getSiblingDB('video_social_db');

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('videos');
db.createCollection('comments');
db.createCollection('likes');
db.createCollection('follows');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "name": 1 });
db.users.createIndex({ "createdAt": -1 });

db.videos.createIndex({ "user._id": 1 });
db.videos.createIndex({ "createdAt": -1 });
db.videos.createIndex({ "title": "text", "description": "text" });

db.comments.createIndex({ "videoId": 1 });
db.comments.createIndex({ "userId": 1 });
db.comments.createIndex({ "createdAt": -1 });

db.likes.createIndex({ "videoId": 1, "userId": 1 }, { unique: true });
db.follows.createIndex({ "followerId": 1, "followingId": 1 }, { unique: true });

// Insert sample data (optional)
db.users.insertOne({
  name: "System Admin",
  email: "admin@videosocial.com",
  avatar: "/no_avatar.png",
  bio: "System administrator account",
  followersList: [],
  followingList: [],
  createdAt: new Date().toISOString()
});

print("MongoDB initialization completed for video social network database");