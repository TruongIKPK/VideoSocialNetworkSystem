import { Share, Platform, Linking } from "react-native";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

/**
 * Share a video
 */
export const shareVideo = async (video: {
  _id: string;
  title?: string;
  description?: string;
  user?: { name?: string; username?: string };
}) => {
  try {
    const videoUrl = `${API_BASE_URL}/videos/${video._id}`;
    const shareMessage = `🎬 ${video.title || "Video"}\n\n${
      video.description ? `${video.description}\n\n` : ""
    }Xem video của ${video.user?.name || video.user?.username || "người dùng"}\n${videoUrl}`;

    const result = await Share.share({
      message: shareMessage,
      url: Platform.OS === "ios" ? videoUrl : shareMessage,
      title: video.title || "Chia sẻ video",
    });

    if (result.action === Share.sharedAction) {
      // Track share if needed
      return { success: true };
    }
    return { success: false, action: result.action };
  } catch (error) {
    console.error("Error sharing video:", error);
    return { success: false, error };
  }
};

/**
 * Share a user profile
 */
export const shareUserProfile = async (user: {
  _id: string;
  name?: string;
  username?: string;
  bio?: string;
}) => {
  try {
    const profileUrl = `${API_BASE_URL}/users/${user._id}`;
    const shareMessage = `👤 ${user.name || user.username || "Người dùng"}\n\n${
      user.bio ? `${user.bio}\n\n` : ""
    }Xem profile: ${profileUrl}`;

    const result = await Share.share({
      message: shareMessage,
      url: Platform.OS === "ios" ? profileUrl : shareMessage,
      title: `Profile của ${user.name || user.username || "người dùng"}`,
    });

    if (result.action === Share.sharedAction) {
      return { success: true };
    }
    return { success: false, action: result.action };
  } catch (error) {
    console.error("Error sharing user profile:", error);
    return { success: false, error };
  }
};

/**
 * Share video with deep link (for app-to-app sharing)
 */
export const shareVideoDeepLink = async (videoId: string) => {
  try {
    // You can use a custom URL scheme or deep link here
    const deepLink = `looply://video/${videoId}`;
    const webUrl = `${API_BASE_URL}/videos/${videoId}`;

    const result = await Share.share({
      message: `Xem video này trên Looply: ${webUrl}`,
      url: Platform.OS === "ios" ? deepLink : webUrl,
      title: "Chia sẻ video",
    });

    return { success: result.action === Share.sharedAction };
  } catch (error) {
    console.error("Error sharing video deep link:", error);
    return { success: false, error };
  }
};

/**
 * Share user profile with deep link
 */
export const shareUserProfileDeepLink = async (userId: string) => {
  try {
    const deepLink = `looply://user/${userId}`;
    const webUrl = `${API_BASE_URL}/users/${userId}`;

    const result = await Share.share({
      message: `Xem profile này trên Looply: ${webUrl}`,
      url: Platform.OS === "ios" ? deepLink : webUrl,
      title: "Chia sẻ profile",
    });

    return { success: result.action === Share.sharedAction };
  } catch (error) {
    console.error("Error sharing user profile deep link:", error);
    return { success: false, error };
  }
};

