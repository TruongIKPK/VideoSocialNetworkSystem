/**
 * Helper functions để xử lý image URIs
 */

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com";
const PLACEHOLDER_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=007AFF&color=fff&size=150";
const PLACEHOLDER_VIDEO =
  "https://via.placeholder.com/400x600/000000/FFFFFF?text=Video";

/**
 * Get avatar URI from string
 */
export const getAvatarUri = (avatar: string | null | undefined) => {
  if (!avatar || avatar === "/no_avatar.png" || avatar === "no_avatar.png") {
    return { uri: PLACEHOLDER_AVATAR };
  }

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return { uri: avatar };
  }

  return { uri: `${API_BASE_URL}${avatar}` };
};

/**
 * Get video thumbnail URI
 */
export const getThumbnailUri = (thumbnail: string | null | undefined) => {
  if (!thumbnail) {
    return { uri: PLACEHOLDER_VIDEO };
  }

  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return { uri: thumbnail };
  }

  return { uri: `${API_BASE_URL}${thumbnail}` };
};

/**
 * Format số lượng (1000 -> 1K, 1000000 -> 1M)
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (!num || num === 0) return "0";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toString();
};
