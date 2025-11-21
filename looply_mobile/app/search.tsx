import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import searchService, {
  VideoSearchResult,
  UserSearchResult,
  HashtagSearchResult,
} from "@/service/searchService";
import { useDebounce } from "@/hooks/useDebounce";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getAvatarUri,
  getThumbnailUri,
  formatNumber,
} from "@/utils/imageHelpers";
import { logger } from "@/utils/logger";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

type TabType = "video" | "user" | "hashtag";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId: currentUserId } = useCurrentUser();
  
  // Nhận params từ navigation (nếu có)
  const initialQuery = (params.query as string) || "";
  const initialTab = (params.tab as TabType) || "video";
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoSearchResult[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSearchResult[]>([]);
  const hasInitialSearchRef = useRef(false); // Flag để tránh duplicate search

  // Giảm tần suất gọi tìm kiếm (debounce) truy vấn tìm kiếm
  // Tăng delay lên 1200ms để tránh rate limit
  const debouncedSearchQuery = useDebounce(searchQuery, 1200);
  
  // State để track rate limit
  const [rateLimited, setRateLimited] = useState(false);

  const loadTrendingHashtags = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await searchService.getTrendingHashtags();
      if (response.success && response.data.length > 0) {
        setHashtags(response.data);
      } else {
        setHashtags([]);
      }
    } catch (error) {
      logger.error(`[Search] Load trending hashtags error:`, error);
      setHashtags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    logger.debug(`[Search] Searching: "${query}" in tab: ${activeTab}`);
    
    try {
      switch (activeTab) {
        case "video": {
          const videoResponse = await searchService.searchVideos(query);
          if (videoResponse.success) {
            // Filter để loại bỏ video của user hiện tại khỏi kết quả
            const filteredVideos = currentUserId 
              ? videoResponse.data.filter(video => String(video.author?._id) !== String(currentUserId))
              : videoResponse.data;
            setVideos(filteredVideos);
          } else {
            logger.warn(`[Search] Video search failed:`, videoResponse.message);
            setVideos([]);
          }
          break;
        }
        case "user": {
          const userResponse = await searchService.searchUsers(query);
          if (userResponse.success) {
            // Filter để loại bỏ user hiện tại khỏi kết quả
            const filteredUsers = currentUserId 
              ? userResponse.data.filter(user => String(user._id) !== String(currentUserId))
              : userResponse.data;
            setUsers(filteredUsers);
          } else {
            logger.warn(`[Search] User search failed:`, userResponse.message);
            setUsers([]);
            
            // Xử lý rate limit
            if (userResponse.message?.includes("Too many requests") || 
                userResponse.message?.includes("Quá nhiều yêu cầu") ||
                userResponse.message?.includes("please try again later")) {
              setRateLimited(true);
              logger.warn(`[Search] Rate limit reached, disabling search temporarily`);
              
              // Tự động bỏ rate limit sau 15 giây
              setTimeout(() => {
                setRateLimited(false);
              }, 15000);
            }
          }
          break;
        }
        case "hashtag": {
          // Search hashtags
          const hashtagResponse = await searchService.searchHashtags(query);
          if (hashtagResponse.success) {
            setHashtags(hashtagResponse.data);
          } else {
            logger.warn(`[Search] Hashtag search failed:`, hashtagResponse.message);
            setHashtags([]);
          }

          // Also search videos by hashtag
          const videoByHashtagResponse = await searchService.searchVideosByHashtags(query);
          if (videoByHashtagResponse.success) {
            // Filter để loại bỏ video của user hiện tại khỏi kết quả
            const filteredVideos = currentUserId 
              ? videoByHashtagResponse.data.filter(video => String(video.author?._id) !== String(currentUserId))
              : videoByHashtagResponse.data;
            setVideos(filteredVideos);
          } else {
            logger.warn(`[Search] Video search by hashtag failed:`, videoByHashtagResponse.message);
            setVideos([]);
          }
          break;
        }
      }
    } catch (error) {
      logger.error(`[Search] Search error:`, error);
      
      // Xóa kết quả khi có lỗi
      if (activeTab === "video") setVideos([]);
      if (activeTab === "user") setUsers([]);
      if (activeTab === "hashtag") setHashtags([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, setVideos, setUsers, setHashtags, setIsLoading, currentUserId]);

  // Xử lý params khi component mount hoặc params thay đổi
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0) {
      setSearchQuery(initialQuery);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      // Nếu không có params, load trending hashtags
      loadTrendingHashtags();
    }
  }, [initialQuery, initialTab, loadTrendingHashtags]);

  // Tự động search khi có initial query (chạy sau khi state đã được set)
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0 && !hasInitialSearchRef.current) {
      hasInitialSearchRef.current = true; // Đánh dấu đã search
      
      // Delay để đảm bảo state đã được set và handleSearch đã sẵn sàng
      const timer = setTimeout(() => {
        handleSearch(initialQuery.trim());
      }, 300);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [initialQuery, handleSearch]);

  // Tìm kiếm khi truy vấn đã được debounce hoặc khi thay đổi tab
  useEffect(() => {
    // Skip nếu đang trong quá trình initial search từ params
    if (hasInitialSearchRef.current && debouncedSearchQuery === initialQuery) {
      return;
    }
    
    // Kiểm tra rate limit trước khi search
    if (rateLimited) {
      return;
    }

    if (debouncedSearchQuery.trim().length > 0) {
      hasInitialSearchRef.current = false; // Reset flag sau initial search
      handleSearch(debouncedSearchQuery);
    } else {
      hasInitialSearchRef.current = false; // Reset flag
      // Xóa kết quả khi ô tìm kiếm trống
      setVideos([]);
      setUsers([]);
      // Tải lại hashtag thịnh hành khi ô tìm kiếm trống và đang ở tab hashtag
      if (activeTab === "hashtag") {
        loadTrendingHashtags();
      } else {
        setHashtags([]);
      }
    }
  }, [debouncedSearchQuery, activeTab, handleSearch, loadTrendingHashtags, initialQuery, rateLimited]);

  const handleVideoPress = (video: VideoSearchResult) => {
    // Navigate về home và scroll đến video này
    router.push({
      pathname: "/(tabs)/home",
      params: { 
        videoId: video._id, 
        scrollToVideo: "true"
      }
    });
  };

  const renderVideoItem = ({ item }: { item: VideoSearchResult }) => (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={getThumbnailUri(item.thumbnail)}
        style={styles.videoThumbnail}
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.videoMeta}>
          <Image
            source={getAvatarUri(item.author?.avatar)}
            style={styles.authorAvatar}
          />
          <Text style={styles.videoAuthor} numberOfLines={1}>
            {item.author?.name || "Unknown"}
          </Text>
        </View>
        <View style={styles.videoStats}>
          <Ionicons name="eye-outline" size={12} color="#999" />
          <Text style={styles.videoStatsText}>{formatNumber(item.views)}</Text>
          <Ionicons
            name="heart-outline"
            size={12}
            color="#999"
            style={{ marginLeft: 8 }}
          />
          <Text style={styles.videoStatsText}>{formatNumber(item.likes)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleUserPress = (user: UserSearchResult) => {
    const userId = String(user._id).trim();
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
      logger.error(`[Search] Invalid userId:`, userId);
      return;
    }
    
    logger.debug(`[Search] Navigating to profile:`, userId);
    
    // Dùng dynamic route profile/[userId] và pass user data qua params để fallback
    router.push({
<<<<<<< HEAD
      pathname: `/(tabs)/profile/${userId}` as any,
      params: {
        // Pass user data để hiển thị tạm thời nếu API fail
        userName: user.name || '',
        userUsername: user.username || '',
        userAvatar: user.avatar || '',
        userBio: user.bio || '',
        userFollowers: String(user.followers || 0),
        userFollowing: String(user.following || 0),
      }
=======
      pathname: "/user/[userId]",
      params: { userId: user._id, username: user.username }
>>>>>>> df4026aa05bbbe506caa98460e56412567405776
    });
  };

  const handleFollowPress = (user: UserSearchResult, e: any) => {
    e.stopPropagation(); // Ngăn trigger user press
    // TODO: Implement follow/unfollow logic
    // Có thể gọi API follow/unfollow ở đây
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => {
    const isFollowing = item.followingList && item.followingList.length > 0;

    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <Image source={getAvatarUri(item.avatar)} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userUsername} numberOfLines={1}>
            @{item.username}
          </Text>
          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          ) : null}
          <View style={styles.userStatsContainer}>
            <Text style={styles.userFollowers}>
              {formatNumber(item.followers)} followers
            </Text>
            <Text style={styles.userFollowing}>
              · {formatNumber(item.following)} following
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={(e) => handleFollowPress(item, e)}
        >
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const handleHashtagPress = async (hashtag: HashtagSearchResult) => {
    // Set query và search videos by hashtag
    const hashtagQuery = hashtag.name.startsWith('#') ? hashtag.name.substring(1) : hashtag.name;
    setSearchQuery(hashtagQuery);
    setActiveTab("hashtag");
    
    // Search videos by hashtag
    setIsLoading(true);
    try {
      const videoResponse = await searchService.searchVideosByHashtags(hashtagQuery);
      if (videoResponse.success) {
        // Filter để loại bỏ video của user hiện tại khỏi kết quả
        const filteredVideos = currentUserId 
          ? videoResponse.data.filter(video => String(video.author?._id) !== String(currentUserId))
          : videoResponse.data;
        setVideos(filteredVideos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      logger.error(`[Search] Error searching videos by hashtag:`, error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHashtagItem = ({ item }: { item: HashtagSearchResult }) => (
    <TouchableOpacity 
      style={styles.hashtagCard}
      onPress={() => handleHashtagPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.hashtagIcon}>
        <Ionicons name="pricetag" size={24} color="#007AFF" />
      </View>
      <View style={styles.hashtagInfo}>
        <Text style={styles.hashtagName} numberOfLines={1}>
          #{item.name}
        </Text>
        <Text style={styles.hashtagCount}>
          {formatNumber(item.count)} bài viết
        </Text>
      </View>
      {item.trending && (
        <View style={styles.trendingBadge}>
          <Ionicons name="flame" size={14} color="#FF3B30" />
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const getDataByTab = () => {
    let data: any[] = [];
    switch (activeTab) {
      case "video":
        data = videos;
        break;
      case "user":
        data = users;
        console.log(`[Search] 📊 getDataByTab - user tab:`, {
          usersArrayLength: users.length,
          usersState: users.map(u => ({ id: u._id, name: u.name, username: u.username }))
        });
        break;
      case "hashtag":
        // Khi search hashtag, hiển thị cả hashtags và videos
        // Nếu có videos (đã search), hiển thị videos trước, sau đó hashtags
        if (videos.length > 0) {
          data = videos;
        } else {
          data = hashtags;
        }
        break;
      default:
        data = [];
    }
    return data;
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (activeTab) {
      case "video":
        return renderVideoItem({ item });
      case "user":
        return renderUserItem({ item });
      case "hashtag":
        // Nếu có videos, render video, nếu không render hashtag
        if (videos.length > 0) {
          return renderVideoItem({ item });
        } else {
          return renderHashtagItem({ item });
        }
      default:
        return null;
    }
  };

  const renderEmptyState = () => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    const data = getDataByTab();

    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateTitle}>Đang tìm kiếm...</Text>
        </View>
      );
    }
    
    // Hiển thị thông báo rate limit
    if (rateLimited) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#FF9500" />
          <Text style={styles.emptyStateTitle}>Quá nhiều yêu cầu</Text>
          <Text style={styles.emptyStateSubtitle}>
            Vui lòng đợi một chút rồi thử lại. Tìm kiếm sẽ được kích hoạt lại sau vài giây.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name={
            activeTab === "video"
              ? "videocam-outline"
              : activeTab === "user"
              ? "people-outline"
              : "pricetag-outline"
          }
          size={48}
          color="#CCC"
        />
        <Text style={styles.emptyStateTitle}>
          {hasSearchQuery
            ? "Không tìm thấy kết quả"
            : activeTab === "hashtag"
            ? "Hashtag phổ biến"
            : `Tìm kiếm ${activeTab === "video" ? "video" : "người dùng"}`}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          {hasSearchQuery
            ? "Thử tìm kiếm với từ khóa khác"
            : activeTab === "hashtag"
            ? "Khám phá các hashtag đang thịnh hành"
            : `Nhập từ khóa để tìm ${
                activeTab === "video" ? "video" : "người dùng"
              }`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Back Button and Search Input */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
            }}
            onSubmitEditing={() => {
              if (searchQuery.trim().length > 0) {
                handleSearch(searchQuery.trim());
              }
            }}
            autoFocus={true}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && !isLoading && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {isLoading && (
            <ActivityIndicator
              size="small"
              color="#007AFF"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "video" && styles.activeTab]}
          onPress={() => {
            setActiveTab("video");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "video" && styles.activeTabText,
            ]}
          >
            Video
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "user" && styles.activeTab]}
          onPress={() => {
            setActiveTab("user");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "user" && styles.activeTabText,
            ]}
          >
            Người dùng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "hashtag" && styles.activeTab]}
          onPress={() => {
            setActiveTab("hashtag");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "hashtag" && styles.activeTabText,
            ]}
          >
            Hashtag
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={getDataByTab()}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          return item._id || `item-${index}`;
        }}
        numColumns={(activeTab === "video" || (activeTab === "hashtag" && videos.length > 0)) ? 2 : 1}
        key={`${activeTab}-${searchQuery}-${isLoading}-${users.length}-${videos.length}-${hashtags.length}`}
        extraData={{ activeTab, searchQuery, isLoading, usersCount: users.length, videosCount: videos.length, hashtagsCount: hashtags.length, users, videos, hashtags }}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          (activeTab === "video" || (activeTab === "hashtag" && videos.length > 0)) ? styles.columnWrapper : undefined
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
    gap: 8,
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  // Video Card
  videoCard: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  videoThumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: "#F0F0F0",
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  authorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: "#F0F0F0",
  },
  videoAuthor: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoStatsText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 4,
  },
  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  userStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userFollowers: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  userFollowing: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  followingButtonText: {
    color: "#666",
  },
  // Hashtag Card
  hashtagCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  hashtagIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  hashtagCount: {
    fontSize: 13,
    color: "#666",
  },
  trendingBadge: {
    marginRight: 8,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
