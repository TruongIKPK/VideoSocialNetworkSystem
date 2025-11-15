import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoSearchResult[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSearchResult[]>([]);

  // Giảm tần suất gọi tìm kiếm (debounce) truy vấn tìm kiếm
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Tải hashtag thịnh hành khi màn hình được mount
  useEffect(() => {
    loadTrendingHashtags();
  }, []);

  // Tìm kiếm khi truy vấn đã được debounce hoặc khi thay đổi tab
  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 0) {
      handleSearch(debouncedSearchQuery);
    } else {
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
  }, [debouncedSearchQuery, activeTab]);

  const loadTrendingHashtags = async () => {
    setIsLoading(true);
    try {
      const response = await searchService.getTrendingHashtags();
      if (response.success && response.data.length > 0) {
        setHashtags(response.data);
      } else {
        setHashtags([]);
      }
    } catch (error) {
      console.error("Load trending hashtags error:", error);
      setHashtags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      switch (activeTab) {
        case "video": {
          const videoResponse = await searchService.searchVideos(query);
          if (videoResponse.success) {
            setVideos(videoResponse.data);
          } else {
            setVideos([]);
          }
          break;
        }
        case "user": {
          const userResponse = await searchService.searchUsers(query);
          if (userResponse.success) {
            setUsers(userResponse.data);
          } else {
            setUsers([]);
          }
          break;
        }
        case "hashtag": {
          const hashtagResponse = await searchService.searchHashtags(query);
          if (hashtagResponse.success) {
            setHashtags(hashtagResponse.data);
          } else {
            setHashtags([]);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      // Xóa kết quả khi có lỗi
      if (activeTab === "video") setVideos([]);
      if (activeTab === "user") setUsers([]);
      if (activeTab === "hashtag") setHashtags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVideoItem = ({ item }: { item: VideoSearchResult }) => (
    <TouchableOpacity style={styles.videoCard}>
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

  const renderUserItem = ({ item }: { item: UserSearchResult }) => {
    const isFollowing = item.followingList && item.followingList.length > 0;

    return (
      <TouchableOpacity style={styles.userCard}>
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

  const renderHashtagItem = ({ item }: { item: HashtagSearchResult }) => (
    <TouchableOpacity style={styles.hashtagCard}>
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
    switch (activeTab) {
      case "video":
        return videos;
      case "user":
        return users;
      case "hashtag":
        return hashtags;
      default:
        return [];
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (activeTab) {
      case "video":
        return renderVideoItem({ item });
      case "user":
        return renderUserItem({ item });
      case "hashtag":
        return renderHashtagItem({ item });
      default:
        return null;
    }
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    const hasSearchQuery = searchQuery.trim().length > 0;

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
          size={64}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
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
          onChangeText={setSearchQuery}
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "video" && styles.activeTab]}
          onPress={() => setActiveTab("video")}
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
          onPress={() => setActiveTab("user")}
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
          onPress={() => setActiveTab("hashtag")}
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
        keyExtractor={(item, index) => item._id || `item-${index}`}
        numColumns={activeTab === "video" ? 2 : 1}
        key={activeTab}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          activeTab === "video" ? styles.columnWrapper : undefined
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    height: 44,
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
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
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
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
