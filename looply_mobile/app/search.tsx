import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

type TabType = "video" | "user" | "hashtag";

interface VideoItem {
  id: string;
  thumbnail: string;
  title: string;
  author: string;
  date: string;
}

interface UserItem {
  id: string;
  avatar: string;
  name: string;
  username: string;
  followers: number;
}

interface HashtagItem {
  id: string;
  name: string;
  count: number;
}

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("video");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const mockVideos: VideoItem[] = [
    {
      id: "1",
      thumbnail: "https://picsum.photos/200/300?random=1",
      title: "Tí sỉa đã hòng Việt Nam về 3-1 cầu đầu băng C",
      author: "Hân Duy Mi",
      date: "20/10/2024",
    },
    {
      id: "2",
      thumbnail: "https://picsum.photos/200/300?random=2",
      title: "Tí sỉa đã hòng Việt Nam về 3-1 cầu đầu băng C",
      author: "Hân Duy Mi",
      date: "20/10/2024",
    },
    {
      id: "3",
      thumbnail: "https://picsum.photos/200/300?random=3",
      title: "Tí sỉa đã hòng Việt Nam về 3-1 cầu đầu băng C",
      author: "Hân Duy Mi",
      date: "20/10/2024",
    },
    {
      id: "4",
      thumbnail: "https://picsum.photos/200/300?random=4",
      title: "Tí sỉa đã hòng Việt Nam về 3-1 cầu đầu băng C",
      author: "Hân Duy Mi",
      date: "20/10/2024",
    },
  ];

  const mockUsers: UserItem[] = [
    {
      id: "1",
      avatar: "https://i.pravatar.cc/150?img=1",
      name: "Nguyễn Văn A",
      username: "@nguyenvana",
      followers: 1234,
    },
    {
      id: "2",
      avatar: "https://i.pravatar.cc/150?img=2",
      name: "Trần Thị B",
      username: "@tranthib",
      followers: 5678,
    },
  ];

  const mockHashtags: HashtagItem[] = [
    { id: "1", name: "#trending", count: 12500 },
    { id: "2", name: "#vietnam", count: 8900 },
    { id: "3", name: "#football", count: 6700 },
  ];

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity style={styles.videoCard}>
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.videoMeta}>
          <Ionicons name="person-circle" size={16} color="#666" />
          <Text style={styles.videoAuthor}>{item.author}</Text>
        </View>
        <Text style={styles.videoDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

   const getAvatarUri = (avatar: string) => {
    if (!avatar) {
      return require("@/assets/images/no_avatar.png");
    }
    
    // Nếu avatar là URL đầy đủ (https://...)
    if (avatar.startsWith("http")) {
      return { uri: avatar };
    }
    
    // Nếu avatar là path tương đối (/no_avatar.png)
    if (avatar === "/no_avatar.png") {
      return require("@/assets/images/no_avatar.png");
    }
    
    // Nếu avatar là path khác
    return { uri: `https://videosocialnetworksystem.onrender.com${avatar}` };
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity style={styles.userCard}>
      <Image
        source={getAvatarUri(item.avatar)}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        ) : null}
        <View style={styles.userStats}>
          <Text style={styles.userFollowers}>
            {item.followers.toLocaleString()} followers
          </Text>
          <Text style={styles.userFollowing}>
            · {item.following.toLocaleString()} following
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.followButton,
          item.followingList && item.followingList.length > 0 && styles.followingButton
        ]}
      >
        <Text 
          style={[
            styles.followButtonText,
            item.followingList && item.followingList.length > 0 && styles.followingButtonText
          ]}
        >
          {item.followingList && item.followingList.length > 0 ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHashtagItem = ({ item }: { item: HashtagItem }) => (
    <TouchableOpacity style={styles.hashtagCard}>
      <View style={styles.hashtagIcon}>
        <Ionicons name="pricetag" size={24} color="#007AFF" />
      </View>
      <View style={styles.hashtagInfo}>
        <Text style={styles.hashtagName}>{item.name}</Text>
        <Text style={styles.hashtagCount}>
          {item.count.toLocaleString()} bài viết
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const getDataByTab = () => {
    switch (activeTab) {
      case "video":
        return mockVideos;
      case "user":
        return mockUsers;
      case "hashtag":
        return mockHashtags;
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "video" && styles.activeTab]}
          onPress={() => setActiveTab("video")}
        >
          <Text style={[styles.tabText, activeTab === "video" && styles.activeTabText]}>
            Video
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "user" && styles.activeTab]}
          onPress={() => setActiveTab("user")}
        >
          <Text style={[styles.tabText, activeTab === "user" && styles.activeTabText]}>
            Người dùng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "hashtag" && styles.activeTab]}
          onPress={() => setActiveTab("hashtag")}
        >
          <Text style={[styles.tabText, activeTab === "hashtag" && styles.activeTabText]}>
            Hashtag
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={getDataByTab()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={activeTab === "video" ? 2 : 1}
        key={activeTab} // Force re-render when tab changes
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={activeTab === "video" ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
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
    marginBottom: 6,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  videoAuthor: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  videoDate: {
    fontSize: 11,
    color: "#999",
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
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
    marginBottom: 2,
  },
  userFollowers: {
    fontSize: 12,
    color: "#999",
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
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
  userStats: {
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
});