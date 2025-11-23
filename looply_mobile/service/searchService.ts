import { logger } from "@/utils/logger";

export interface VideoSearchResult {
  _id: string;
  thumbnail: string;
  title: string;
  description: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  views: number;
  likes: number;
}

export interface UserSearchResult {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followers: number;
  followersList: string[];
  following: number;
  followingList: string[];
  likes?: number;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
}

export interface HashtagSearchResult {
  _id: string;
  name: string;
  count: number;
  trending?: boolean;
}

export interface SearchResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  total?: number;
}

// API Response interfaces
interface UserSearchAPIResponse {
  total: number;
  users: UserSearchResult[];
}

interface VideoSearchAPIResponse {
  total: number;
  videos: VideoSearchResult[];
}

interface HashtagSearchAPIResponse {
  total: number;
  hashtags: HashtagSearchResult[];
}

export const searchService = {
  API_BASE_URL: "https://videosocialnetworksystem.onrender.com/api",

  /**
   * Tìm kiếm video
   */
  async searchVideos(
    query: string
  ): Promise<SearchResponse<VideoSearchResult>> {
    try {
      const url = `${this.API_BASE_URL}/videos/search?q=${encodeURIComponent(query)}`;
      logger.debug(`[searchService] Searching videos:`, query);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: VideoSearchAPIResponse = await response.json();
        
        // Normalize video data: handle both old format (user) and new format (author)
        const normalizedVideos = (data.videos || []).map((video: any) => {
          return {
            _id: video._id,
            title: video.title || "",
            description: video.description || "",
            thumbnail: video.thumbnail || video.url || "",
            url: video.url || "",
            author: video.author || video.user || { _id: "", name: "Unknown", avatar: "" },
            createdAt: video.createdAt || new Date().toISOString(),
            views: video.views || 0,
            likes: video.likes || video.likesCount || 0,
          };
        });
        
        return {
          success: true,
          data: normalizedVideos,
          total: data.total || normalizedVideos.length,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        logger.error(`[searchService] Video search failed:`, errorData);
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm video thất bại",
        };
      }
    } catch (error) {
      logger.error("[searchService] Search videos error:", error);
      return {
        success: false,
        data: [],
        message: `Không thể kết nối đến máy chủ: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Tìm kiếm video theo hashtag
   */
  async searchVideosByHashtags(
    hashtag: string
  ): Promise<SearchResponse<VideoSearchResult>> {
    try {
      // Remove # if present
      const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
      const url = `${this.API_BASE_URL}/videos/search/hashtags?hashtags=${encodeURIComponent(cleanHashtag)}`;
      logger.debug(`[searchService] Searching videos by hashtag:`, cleanHashtag);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: VideoSearchAPIResponse = await response.json();

        // Normalize video data
        const normalizedVideos = (data.videos || []).map((video: any) => {
          return {
            _id: video._id,
            title: video.title || "",
            description: video.description || "",
            thumbnail: video.thumbnail || video.url || "",
            url: video.url || "",
            author: video.author || video.user || { _id: "", name: "Unknown", avatar: "" },
            createdAt: video.createdAt || new Date().toISOString(),
            views: video.views || 0,
            likes: video.likes || video.likesCount || 0,
          };
        });

        return {
          success: true,
          data: normalizedVideos,
          total: data.total || normalizedVideos.length,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        logger.error(`[searchService] Video search by hashtag failed:`, errorData);
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm video theo hashtag thất bại",
        };
      }
    } catch (error) {
      logger.error("[searchService] Search videos by hashtag error:", error);
      return {
        success: false,
        data: [],
        message: `Không thể kết nối đến máy chủ: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Tìm kiếm người dùng
   */
  async searchUsers(query: string): Promise<SearchResponse<UserSearchResult>> {
    try {
      const url = `${this.API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`;
      logger.debug(`[searchService] Searching users:`, query);
      
      // Thêm timeout cho fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data: UserSearchAPIResponse = await response.json();
        
        return {
          success: true,
          data: data.users || [],
          total: data.total || 0,
        };
      } else {
        // Cải thiện error handling
        let errorData: any = { message: "Unknown error" };
        const contentType = response.headers.get("content-type");
        
        try {
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            logger.error(`[searchService] Non-JSON error response:`, text);
            errorData = { message: text || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          logger.error(`[searchService] Failed to parse error response:`, parseError);
          errorData = { 
            message: `HTTP ${response.status}: ${response.statusText || "Unknown error"}` 
          };
        }
        
        // Xử lý các loại lỗi khác nhau - xử lý cả error.message và message
        let errorMessage = errorData.message || errorData.error?.message || `Tìm kiếm người dùng thất bại (${response.status})`;
        
        if (response.status === 429) {
          // Lấy message từ error object nếu có
          const rateLimitMessage = errorData.error?.message || errorData.message;
          errorMessage = rateLimitMessage || "Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.";
          logger.warn(`[searchService] Rate limit reached: ${errorMessage}`);
        } else if (response.status === 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại sau.";
        } else if (response.status === 404) {
          errorMessage = "Không tìm thấy kết quả.";
        }
        
        return {
          success: false,
          data: [],
          message: errorMessage,
        };
      }
    } catch (error) {
      logger.error("[searchService] Search users error:", error);
      
      let errorMessage = "Không thể kết nối đến máy chủ";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timeout - Vui lòng thử lại";
        } else {
          errorMessage = `Lỗi: ${error.message}`;
        }
      } else {
        errorMessage = `Lỗi không xác định: ${String(error)}`;
      }
      
      return {
        success: false,
        data: [],
        message: errorMessage,
      };
    }
  },

  /**
   * Tìm kiếm hashtag
   */
  async searchHashtags(
    query: string
  ): Promise<SearchResponse<HashtagSearchResult>> {
    try {
      const url = `${this.API_BASE_URL}/hashtags/search?q=${encodeURIComponent(query)}`;
      logger.debug(`[searchService] Searching hashtags:`, query);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: HashtagSearchAPIResponse = await response.json();
        
        return {
          success: true,
          data: data.hashtags || [],
          total: data.total || 0,
        };
      } else {
        // Hashtag endpoint có thể chưa có, trả về empty array thay vì error
        logger.warn(`[searchService] Hashtag search endpoint not available (${response.status})`);
        return {
          success: true,
          data: [],
          total: 0,
        };
      }
    } catch (error) {
      logger.error("[searchService] Search hashtags error:", error);
      // Trả về success với empty array để không break UI
      return {
        success: true,
        data: [],
        total: 0,
      };
    }
  },

  /**
   * Lấy trending hashtags
   */
  async getTrendingHashtags(): Promise<SearchResponse<HashtagSearchResult>> {
    try {
      const url = `${this.API_BASE_URL}/hashtags/trending`;
      logger.debug(`[searchService] Fetching trending hashtags`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          data: data.hashtags || [],
          total: data.total || 0,
        };
      } else {
        logger.warn(`[searchService] Trending hashtags endpoint not available (${response.status})`);
        return {
          success: true,
          data: [],
        };
      }
    } catch (error) {
      logger.error("[searchService] Get trending hashtags error:", error);
      return {
        success: true,
        data: [],
      };
    }
  },
};

export default searchService;
