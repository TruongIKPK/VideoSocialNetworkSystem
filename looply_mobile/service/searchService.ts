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
      console.log(`[searchService] Calling: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`[searchService] Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data: VideoSearchAPIResponse = await response.json();
        console.log(`[searchService] ✅ Video search success: ${data.videos?.length || 0} videos found`);
        console.log(`[searchService] Raw API response:`, JSON.stringify(data, null, 2));
        
        // Normalize video data: handle both old format (user) and new format (author)
        const normalizedVideos = (data.videos || []).map((video: any, index: number) => {
          const normalized = {
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
          
          console.log(`[searchService] Video ${index + 1}:`, {
            title: normalized.title,
            hasAuthor: !!normalized.author,
            authorName: normalized.author?.name,
            views: normalized.views,
            likes: normalized.likes,
            hasThumbnail: !!normalized.thumbnail
          });
          
          return normalized;
        });
        
        console.log(`[searchService] Normalized ${normalizedVideos.length} videos`);
        
        return {
          success: true,
          data: normalizedVideos,
          total: data.total || normalizedVideos.length,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error(`[searchService] Video search failed:`, errorData);
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm video thất bại",
        };
      }
    } catch (error) {
      console.error("[searchService] Search videos error:", error);
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
      console.log(`[searchService] Calling: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`[searchService] Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data: VideoSearchAPIResponse = await response.json();
        console.log(`[searchService] ✅ Video search by hashtag success: ${data.videos?.length || 0} videos found`);
        console.log(`[searchService] Raw API response:`, JSON.stringify(data, null, 2));

        // Normalize video data
        const normalizedVideos = (data.videos || []).map((video: any, index: number) => {
          const normalized = {
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

          console.log(`[searchService] Video ${index + 1}:`, {
            title: normalized.title,
            hasAuthor: !!normalized.author,
            authorName: normalized.author?.name,
            views: normalized.views,
            likes: normalized.likes,
            hasThumbnail: !!normalized.thumbnail
          });

          return normalized;
        });

        console.log(`[searchService] Normalized ${normalizedVideos.length} videos`);

        return {
          success: true,
          data: normalizedVideos,
          total: data.total || normalizedVideos.length,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error(`[searchService] Video search by hashtag failed:`, errorData);
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm video theo hashtag thất bại",
        };
      }
    } catch (error) {
      console.error("[searchService] Search videos by hashtag error:", error);
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
      console.log(`[searchService] Calling: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`[searchService] Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data: UserSearchAPIResponse = await response.json();
        console.log(`[searchService] ✅ User search success: ${data.users?.length || 0} users found`);
        console.log(`[searchService] Raw API response:`, JSON.stringify(data, null, 2));
        
        data.users?.forEach((user, index) => {
          console.log(`[searchService] User ${index + 1}:`, {
            name: user.name,
            username: user.username,
            hasAvatar: !!user.avatar,
            followers: user.followers,
            following: user.following
          });
        });
        
        return {
          success: true,
          data: data.users || [],
          total: data.total || 0,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error(`[searchService] User search failed:`, errorData);
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm người dùng thất bại",
        };
      }
    } catch (error) {
      console.error("[searchService] Search users error:", error);
      return {
        success: false,
        data: [],
        message: `Không thể kết nối đến máy chủ: ${error instanceof Error ? error.message : String(error)}`,
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
      console.log(`[searchService] Calling: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`[searchService] Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data: HashtagSearchAPIResponse = await response.json();
        console.log(`[searchService] ✅ Hashtag search success: ${data.hashtags?.length || 0} hashtags found`);
        console.log(`[searchService] Raw API response:`, JSON.stringify(data, null, 2));
        
        data.hashtags?.forEach((hashtag, index) => {
          console.log(`[searchService] Hashtag ${index + 1}:`, {
            name: hashtag.name,
            count: hashtag.count,
            trending: hashtag.trending
          });
        });
        
        return {
          success: true,
          data: data.hashtags || [],
          total: data.total || 0,
        };
      } else {
        // Hashtag endpoint có thể chưa có, trả về empty array thay vì error
        console.warn(`[searchService] Hashtag search endpoint not available (${response.status})`);
        return {
          success: true,
          data: [],
          total: 0,
        };
      }
    } catch (error) {
      console.error("[searchService] Search hashtags error:", error);
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
      console.log(`[searchService] Calling: ${url}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`[searchService] Response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[searchService] ✅ Trending hashtags success: ${data.hashtags?.length || 0} hashtags found`);
        console.log(`[searchService] Raw API response:`, JSON.stringify(data, null, 2));
        
        data.hashtags?.forEach((hashtag: HashtagSearchResult, index: number) => {
          console.log(`[searchService] Trending hashtag ${index + 1}:`, {
            name: hashtag.name,
            count: hashtag.count,
            trending: hashtag.trending
          });
        });
        
        return {
          success: true,
          data: data.hashtags || [],
          total: data.total || 0,
        };
      } else {
        console.warn(`[searchService] Trending hashtags endpoint not available (${response.status})`);
        return {
          success: true,
          data: [],
        };
      }
    } catch (error) {
      console.error("[searchService] Get trending hashtags error:", error);
      return {
        success: true,
        data: [],
      };
    }
  },
};

export default searchService;
