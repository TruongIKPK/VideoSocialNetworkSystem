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
      const response = await fetch(
        `${this.API_BASE_URL}/videos/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: VideoSearchAPIResponse = await response.json();
        return {
          success: true,
          data: data.videos || [],
          total: data.total || 0,
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm video thất bại",
        };
      }
    } catch (error) {
      console.error("Search videos error:", error);
      return {
        success: false,
        data: [],
        message: "Không thể kết nối đến máy chủ",
      };
    }
  },

  /**
   * Tìm kiếm người dùng
   */
  async searchUsers(query: string): Promise<SearchResponse<UserSearchResult>> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: UserSearchAPIResponse = await response.json();
        return {
          success: true,
          data: data.users || [],
          total: data.total || 0,
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm người dùng thất bại",
        };
      }
    } catch (error) {
      console.error("Search users error:", error);
      return {
        success: false,
        data: [],
        message: "Không thể kết nối đến máy chủ",
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
      const response = await fetch(
        `${this.API_BASE_URL}/hashtags/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: HashtagSearchAPIResponse = await response.json();
        return {
          success: true,
          data: data.hashtags || [],
          total: data.total || 0,
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          data: [],
          message: errorData.message || "Tìm kiếm hashtag thất bại",
        };
      }
    } catch (error) {
      console.error("Search hashtags error:", error);
      return {
        success: false,
        data: [],
        message: "Không thể kết nối đến máy chủ",
      };
    }
  },

  /**
   * Lấy trending hashtags
   */
  async getTrendingHashtags(): Promise<SearchResponse<HashtagSearchResult>> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hashtags/trending`, {
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
        return {
          success: true,
          data: [],
        };
      }
    } catch (error) {
      console.error("Get trending hashtags error:", error);
      return {
        success: true,
        data: [],
      };
    }
  },
};

export default searchService;
