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
import {
  getAvatarUri,
  getThumbnailUri,
  formatNumber,
} from "@/utils/imageHelpers";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

type TabType = "video" | "user" | "hashtag";

export default function SearchScreen() {
  console.log(`[Search] 🎬 SearchScreen component rendered`);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  
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
  
  console.log(`[Search] 📥 Received params:`, { query: initialQuery, tab: initialTab });

  console.log(`[Search] 📊 Current state:`, {
    activeTab,
    searchQuery: `"${searchQuery}"`,
    searchQueryLength: searchQuery.length,
    isLoading,
    videosCount: videos.length,
    usersCount: users.length,
    hashtagsCount: hashtags.length
  });

  // Giảm tần suất gọi tìm kiếm (debounce) truy vấn tìm kiếm
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Log khi searchQuery thay đổi
  useEffect(() => {
    console.log(`[Search] 📝 searchQuery changed: "${searchQuery}"`);
  }, [searchQuery]);

  // Log khi debouncedSearchQuery thay đổi
  useEffect(() => {
    console.log(`[Search] ⏱️ debouncedSearchQuery changed: "${debouncedSearchQuery}"`);
  }, [debouncedSearchQuery]);

  // Log khi activeTab thay đổi
  useEffect(() => {
    console.log(`[Search] 📑 activeTab changed: ${activeTab}`);
  }, [activeTab]);

  const loadTrendingHashtags = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`\n[Search] 🔥 Loading trending hashtags...`);
      const response = await searchService.getTrendingHashtags();
      console.log(`[Search] 🔥 Trending hashtags response:`, {
        success: response.success,
        count: response.data?.length || 0,
        total: response.total || 0
      });
      if (response.success && response.data.length > 0) {
        console.log(`[Search] ✅ Setting ${response.data.length} trending hashtags to state`);
        setHashtags(response.data);
      } else {
        console.log(`[Search] ⚠️ No trending hashtags found, setting empty array`);
        setHashtags([]);
      }
    } catch (error) {
      console.error(`[Search] ❌ Load trending hashtags error:`, error);
      setHashtags([]);
    } finally {
      setIsLoading(false);
      console.log(`[Search] Loading state set to: false\n`);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      console.log(`[Search] ⚠️ Empty query, skipping search`);
      return;
    }

    setIsLoading(true);
    console.log(`\n[Search] 🔍 ========== START SEARCH ==========`);
    console.log(`[Search] Query: "${query}"`);
    console.log(`[Search] Active Tab: ${activeTab}`);
    console.log(`[Search] Timestamp: ${new Date().toISOString()}`);
    
    try {
      switch (activeTab) {
        case "video": {
          console.log(`[Search] 📹 Searching videos...`);
          const videoResponse = await searchService.searchVideos(query);
          console.log(`[Search] 📹 Video response summary:`, {
            success: videoResponse.success,
            count: videoResponse.data?.length || 0,
            total: videoResponse.total || 0,
            message: videoResponse.message || "OK"
          });
          
          if (videoResponse.success) {
            console.log(`[Search] ✅ Setting ${videoResponse.data.length} videos to state`);
            setVideos(videoResponse.data);
          } else {
            console.warn(`[Search] ❌ Video search failed:`, videoResponse.message);
            setVideos([]);
          }
          break;
        }
        case "user": {
          console.log(`[Search] 👤 Searching users...`);
          const userResponse = await searchService.searchUsers(query);
          console.log(`[Search] 👤 User response summary:`, {
            success: userResponse.success,
            count: userResponse.data?.length || 0,
            total: userResponse.total || 0,
            message: userResponse.message || "OK"
          });
          
          if (userResponse.success) {
            console.log(`[Search] ✅ Setting ${userResponse.data.length} users to state`);
            console.log(`[Search] 👤 Users data:`, userResponse.data.map(u => ({
              id: u._id,
              name: u.name,
              username: u.username
            })));
            setUsers(userResponse.data);
            // Force re-render
            console.log(`[Search] 👤 State updated, users count: ${userResponse.data.length}`);
          } else {
            console.warn(`[Search] ❌ User search failed:`, userResponse.message);
            setUsers([]);
          }
          break;
        }
        case "hashtag": {
          console.log(`[Search] #️⃣ Searching hashtags and videos by hashtag...`);
          
          // Search hashtags
          const hashtagResponse = await searchService.searchHashtags(query);
          console.log(`[Search] #️⃣ Hashtag response summary:`, {
            success: hashtagResponse.success,
            count: hashtagResponse.data?.length || 0,
            total: hashtagResponse.total || 0,
            message: hashtagResponse.message || "OK"
          });

          if (hashtagResponse.success) {
            console.log(`[Search] ✅ Setting ${hashtagResponse.data.length} hashtags to state`);
            setHashtags(hashtagResponse.data);
          } else {
            console.warn(`[Search] ❌ Hashtag search failed:`, hashtagResponse.message);
            setHashtags([]);
          }

          // Also search videos by hashtag
          const videoByHashtagResponse = await searchService.searchVideosByHashtags(query);
          console.log(`[Search] 📹 Video by hashtag response summary:`, {
            success: videoByHashtagResponse.success,
            count: videoByHashtagResponse.data?.length || 0,
            total: videoByHashtagResponse.total || 0,
            message: videoByHashtagResponse.message || "OK"
          });

          if (videoByHashtagResponse.success) {
            console.log(`[Search] ✅ Setting ${videoByHashtagResponse.data.length} videos by hashtag to state`);
            setVideos(videoByHashtagResponse.data);
          } else {
            console.warn(`[Search] ❌ Video search by hashtag failed:`, videoByHashtagResponse.message);
            setVideos([]);
          }
          break;
        }
      }
      console.log(`[Search] ✅ ========== SEARCH COMPLETE ==========\n`);
    } catch (error) {
      console.error(`[Search] ❌ ========== SEARCH ERROR ==========`);
      console.error("[Search] Error details:", error);
      if (error instanceof Error) {
        console.error("[Search] Error message:", error.message);
        console.error("[Search] Error stack:", error.stack);
      }
      console.error(`[Search] ======================================\n`);
      
      // Xóa kết quả khi có lỗi
      if (activeTab === "video") setVideos([]);
      if (activeTab === "user") setUsers([]);
      if (activeTab === "hashtag") setHashtags([]);
    } finally {
      setIsLoading(false);
      console.log(`[Search] Loading state set to: false`);
    }
  }, [activeTab, setVideos, setUsers, setHashtags, setIsLoading]);

  // Xử lý params khi component mount hoặc params thay đổi
  useEffect(() => {
    console.log(`[Search] 📥 Params effect triggered:`, { 
      initialQuery, 
      initialTab,
      hasQuery: !!initialQuery,
      hasTab: !!initialTab
    });
    
    if (initialQuery && initialQuery.trim().length > 0) {
      console.log(`[Search] 📥 Setting query and tab from params`);
      setSearchQuery(initialQuery);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      // Nếu không có params, load trending hashtags
      console.log(`[Search] 🚀 No params, loading trending hashtags...`);
      loadTrendingHashtags();
    }
  }, [initialQuery, initialTab, loadTrendingHashtags]);

  // Tự động search khi có initial query (chạy sau khi state đã được set)
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0 && !hasInitialSearchRef.current) {
      console.log(`[Search] 🔍 Auto-searching with initial query: "${initialQuery}" in tab: ${initialTab || "video"}`);
      hasInitialSearchRef.current = true; // Đánh dấu đã search
      
      // Delay để đảm bảo state đã được set và handleSearch đã sẵn sàng
      const timer = setTimeout(() => {
        console.log(`[Search] 🔍 Executing auto-search now...`);
        handleSearch(initialQuery.trim());
      }, 300);
      return () => {
        console.log(`[Search] 🧹 Cleaning up auto-search timer`);
        clearTimeout(timer);
      };
    }
  }, [initialQuery, handleSearch]); // Chỉ depend vào initialQuery và handleSearch

  // Tìm kiếm khi truy vấn đã được debounce hoặc khi thay đổi tab
  useEffect(() => {
    console.log(`[Search] 🔄 useEffect triggered:`, {
      debouncedSearchQuery: `"${debouncedSearchQuery}"`,
      debouncedLength: debouncedSearchQuery.trim().length,
      activeTab: activeTab,
      hasInitialSearch: hasInitialSearchRef.current
    });

    // Skip nếu đang trong quá trình initial search từ params
    if (hasInitialSearchRef.current && debouncedSearchQuery === initialQuery) {
      console.log(`[Search] ⏭️ Skipping debounce search (initial search in progress)`);
      return;
    }

    if (debouncedSearchQuery.trim().length > 0) {
      console.log(`[Search] ✅ Query has content, calling handleSearch...`);
      hasInitialSearchRef.current = false; // Reset flag sau initial search
      handleSearch(debouncedSearchQuery);
    } else {
      console.log(`[Search] ⚠️ Query is empty, clearing results...`);
      hasInitialSearchRef.current = false; // Reset flag
      // Xóa kết quả khi ô tìm kiếm trống
      setVideos([]);
      setUsers([]);
      // Tải lại hashtag thịnh hành khi ô tìm kiếm trống và đang ở tab hashtag
      if (activeTab === "hashtag") {
        console.log(`[Search] 🔥 Loading trending hashtags (empty query, hashtag tab)`);
        loadTrendingHashtags();
      } else {
        setHashtags([]);
      }
    }
  }, [debouncedSearchQuery, activeTab, handleSearch, loadTrendingHashtags, initialQuery]);

  const handleVideoPress = (video: VideoSearchResult) => {
    console.log(`[Search] 🎬 Video pressed:`, video._id);
    // Navigate về home và có thể scroll đến video này
    // Hoặc tạo màn hình chi tiết video
    router.push({
      pathname: "/(tabs)/home",
      params: { videoId: video._id, scrollToVideo: "true" }
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
    console.log(`[Search] 👤 User pressed:`, user._id, user.username);
    // Navigate đến profile của user này
    router.push({
      pathname: "/user/[userId]",
      params: { userId: user._id, username: user.username }
    });
  };

  const handleFollowPress = (user: UserSearchResult, e: any) => {
    e.stopPropagation(); // Ngăn trigger user press
    console.log(`[Search] ➕ Follow button pressed for user:`, user._id);
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
    console.log(`[Search] #️⃣ Hashtag pressed:`, hashtag.name);
    
    // Set query và search videos by hashtag
    const hashtagQuery = hashtag.name.startsWith('#') ? hashtag.name.substring(1) : hashtag.name;
    setSearchQuery(hashtagQuery);
    setActiveTab("hashtag");
    
    // Search videos by hashtag
    setIsLoading(true);
    try {
      const videoResponse = await searchService.searchVideosByHashtags(hashtagQuery);
      console.log(`[Search] 📹 Video by hashtag response:`, {
        success: videoResponse.success,
        count: videoResponse.data?.length || 0,
        total: videoResponse.total || 0
      });

      if (videoResponse.success) {
        setVideos(videoResponse.data);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error(`[Search] ❌ Error searching videos by hashtag:`, error);
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
    console.log(`[Search] 📊 getDataByTab:`, {
      activeTab,
      dataLength: data.length,
      videosLength: videos.length,
      hashtagsLength: hashtags.length,
      data: data.slice(0, 3).map(item => ({
        id: item._id,
        name: item.name || item.title || item.username
      }))
    });
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
    
    console.log(`[Search] 🎨 renderEmptyState:`, {
      isLoading,
      hasSearchQuery,
      activeTab,
      dataLength: data.length,
      shouldShowEmpty: !isLoading && data.length === 0
    });

    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateTitle}>Đang tìm kiếm...</Text>
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
              console.log(`[Search] ⌨️ TextInput onChangeText: "${text}"`);
              setSearchQuery(text);
            }}
            onFocus={() => {
              console.log(`[Search] 👁️ TextInput focused`);
            }}
            onBlur={() => {
              console.log(`[Search] 👁️ TextInput blurred`);
            }}
            onSubmitEditing={() => {
              console.log(`[Search] ⏎ TextInput submitted with: "${searchQuery}"`);
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
            console.log(`[Search] 📑 Tab "video" pressed`);
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
            console.log(`[Search] 📑 Tab "user" pressed`);
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
            console.log(`[Search] 📑 Tab "hashtag" pressed`);
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
          const key = item._id || `item-${index}`;
          console.log(`[Search] 🔑 KeyExtractor:`, { key, index, activeTab });
          return key;
        }}
        numColumns={(activeTab === "video" || (activeTab === "hashtag" && videos.length > 0)) ? 2 : 1}
        key={`${activeTab}-${searchQuery}-${isLoading}`}
        extraData={{ activeTab, searchQuery, isLoading, users: users.length, videos: videos.length, hashtags: hashtags.length }}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          (activeTab === "video" || (activeTab === "hashtag" && videos.length > 0)) ? styles.columnWrapper : undefined
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onLayout={() => {
          console.log(`[Search] 📐 FlatList onLayout, data length: ${getDataByTab().length}`);
        }}
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
