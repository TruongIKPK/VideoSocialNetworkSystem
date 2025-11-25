import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { logger } from "@/utils/logger";

const { width } = Dimensions.get("window");
const itemWidth = (width - 60) / 3;
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface VideoPost {
  _id: string;
  url: string;
  thumbnail: string;
  title: string;
  likes?: number;
  views?: number;
}

export default function UserProfile() {
  const { user: currentUser, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const Colors = useColors(); // Get theme-aware colors
  
  // Lấy userId từ dynamic route [userId]
  // Trong expo-router, dynamic route params có thể là string hoặc string[]
  const targetUserId = Array.isArray(params.userId) 
    ? params.userId[0] 
    : (params.userId as string | undefined);
  
  // Lấy user data từ params (fallback từ search results)
  const fallbackUserData = params.userName ? {
    _id: targetUserId,
    name: Array.isArray(params.userName) ? params.userName[0] : params.userName,
    username: Array.isArray(params.userUsername) ? params.userUsername[0] : params.userUsername,
    avatar: Array.isArray(params.userAvatar) ? params.userAvatar[0] : params.userAvatar,
    bio: Array.isArray(params.userBio) ? params.userBio[0] : params.userBio,
    followers: parseInt(Array.isArray(params.userFollowers) ? params.userFollowers[0] : params.userFollowers || '0'),
    following: parseInt(Array.isArray(params.userFollowing) ? params.userFollowing[0] : params.userFollowing || '0'),
  } : null;
  
  const [profileUser, setProfileUser] = useState<any>(fallbackUserData);
  const [activeTab, setActiveTab] = useState<"video" | "favorites" | "liked">("video");
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [favorites, setFavorites] = useState<VideoPost[]>([]);
  const [liked, setLiked] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  useEffect(() => {
    if (targetUserId) {
      fetchOtherUserProfile(targetUserId);
    } else {
      logger.warn(`[UserProfile] No userId provided`);
      setIsLoading(false);
    }
  }, [targetUserId]);

  const fetchOtherUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/users/${userId}`;
      logger.debug(`[UserProfile] Fetching user profile:`, userId);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const userData = await response.json();

        // Fetch following count
        const followingResponse = await fetch(
          `${API_BASE_URL}/users/${userId}/following`
        );
        let followingCount = userData.following || 0;
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          followingCount = followingData.total || 0;
        }

        // Fetch followers count
        const followersResponse = await fetch(
          `${API_BASE_URL}/users/${userId}/followers`
        );
        let followersCount = userData.followers || 0;
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          followersCount = followersData.total || 0;
        }

        // Update userData with accurate counts
        setProfileUser({
          ...userData,
          following: followingCount,
          followers: followersCount,
        });
        
        // Fetch videos của user đó
        const videosResponse = await fetch(`${API_BASE_URL}/videos/user/${userId}`);
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          const videosArray = Array.isArray(videosData.videos || videosData) 
            ? (videosData.videos || videosData) 
            : [];
          setVideos(videosArray);
        } else {
          logger.warn(`[UserProfile] Failed to fetch videos:`, videosResponse.status);
          setVideos([]);
        }
      } else {
        // Cải thiện error handling
        let errorMessage = "Không tìm thấy người dùng";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          logger.error(`[UserProfile] Failed to parse error response:`, parseError);
        }
        
        logger.error(`[UserProfile] Failed to fetch user profile:`, {
          status: response.status,
          userId: userId,
          message: errorMessage
        });
        
        // Nếu là 404, có thể do backend chưa có route này
        if (response.status === 404) {
          logger.warn(`[UserProfile] 404 - Using fallback user data if available`);
          
          // Sử dụng fallback data từ search results nếu có
          if (fallbackUserData) {
            setProfileUser(fallbackUserData);
            // Vẫn fetch videos nếu có thể
            try {
              const videosResponse = await fetch(`${API_BASE_URL}/videos/user/${userId}`);
              if (videosResponse.ok) {
                const videosData = await videosResponse.json();
                const videosArray = Array.isArray(videosData.videos || videosData) 
                  ? (videosData.videos || videosData) 
                  : [];
                setVideos(videosArray);
              }
            } catch (videoError) {
              logger.warn(`[UserProfile] Could not fetch videos:`, videoError);
            }
            setIsLoading(false);
            return; // Không set profileUser = null, giữ fallback data
          }
        }
        
        // Chỉ set null nếu không có fallback data
        if (!fallbackUserData) {
          setProfileUser(null);
        }
      }
    } catch (error) {
      logger.error("[UserProfile] Error fetching user profile:", error);
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    if (targetUserId) {
      setRefreshing(true);
      fetchOtherUserProfile(targetUserId).then(() => {
        setRefreshing(false);
      });
    }
  };

  const renderVideoItem = ({ item }: { item: VideoPost }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => router.push("/(tabs)/home")}
      activeOpacity={0.8}
    >
      <Image
        source={getAvatarUri(item.thumbnail)}
        style={styles.videoThumbnail}
        contentFit="cover"
      />
      <View style={styles.videoOverlay}>
        <View style={styles.videoStats}>
          <Ionicons name="eye-outline" size={12} color={Colors.white} />
          <Text style={styles.videoStatsText}>{formatNumber(item.views || 0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Loading profile..." color={Colors.primary} fullScreen />
      </SafeAreaView>
    );
  }

  if (!profileUser && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.gray[400]} />
          <Text style={styles.notLoggedInText}>Không tìm thấy người dùng</Text>
          <Text style={[styles.notLoggedInText, { fontSize: Typography.fontSize.sm, marginTop: Spacing.sm }]}>
            Có thể người dùng này không tồn tại hoặc đã bị xóa.
          </Text>
          <Button
            title="Quay lại"
            onPress={() => router.back()}
            variant="primary"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentVideos = activeTab === "video" ? videos : activeTab === "favorites" ? favorites : liked;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={getAvatarUri(profileUser?.avatar)}
            style={styles.avatar}
            contentFit="cover"
          />

          <Text style={styles.username}>{profileUser?.name || profileUser?.username || "User"}</Text>
          {profileUser?.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              title="Follow"
              onPress={() => {
                // TODO: Implement follow functionality
                // TODO: Implement follow logic
              }}
              variant="primary"
              size="sm"
            />
            <Button
              title="Chia sẻ"
              onPress={async () => {
                if (profileUser) {
                  const { shareUserProfile } = await import("@/utils/shareHelpers");
                  await shareUserProfile({
                    _id: profileUser._id,
                    name: profileUser.name,
                    username: profileUser.username,
                    bio: profileUser.bio,
                  });
                }
              }}
              variant="ghost"
              size="sm"
            />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatNumber(profileUser?.following || 0)}
              </Text>
              <Text style={styles.statLabel}>Đang follow</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatNumber(profileUser?.followers || 0)}
              </Text>
              <Text style={styles.statLabel}>Follower</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatNumber(videos.reduce((sum, v) => sum + (v.likes || 0), 0))}
              </Text>
              <Text style={styles.statLabel}>Lượt thích</Text>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "video" && styles.activeTab]}
              onPress={() => setActiveTab("video")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={16}
                color={activeTab === "video" ? Colors.primary : Colors.gray[400]}
              />
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
              style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
              onPress={() => setActiveTab("favorites")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={activeTab === "favorites" ? Colors.primary : Colors.gray[400]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "favorites" && styles.activeTabText,
                ]}
              >
                Yêu thích
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "liked" && styles.activeTab]}
              onPress={() => setActiveTab("liked")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={activeTab === "liked" ? Colors.primary : Colors.gray[400]}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "liked" && styles.activeTabText,
                ]}
              >
                Đã thích
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on active tab */}
        {currentVideos.length > 0 ? (
          <View style={styles.videoGrid}>
            {currentVideos.map((item) => (
              <View key={item._id} style={styles.videoItemWrapper}>
                {renderVideoItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === "video" ? "videocam-off-outline" : "bookmark-outline"}
              size={64}
              color={Colors.gray[400]}
            />
            <Text style={styles.emptyText}>
              {activeTab === "video"
                ? "Chưa có video nào"
                : activeTab === "favorites"
                ? "Chưa có video yêu thích"
                : "Chưa có video đã thích"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.light,
    },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.avatar,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  username: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  bio: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
    fontFamily: Typography.fontFamily.regular,
  },
  tabContainer: {
    flexDirection: "row",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[400],
    fontFamily: Typography.fontFamily.regular,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  videoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  videoItemWrapper: {
    width: itemWidth,
    marginHorizontal: 2.5,
    marginBottom: Spacing.sm,
  },
  videoItem: {
    width: "100%",
    height: itemWidth * 1.4,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.gray[200],
    ...Shadows.sm,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: Spacing.xs,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
  },
  videoStatsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
  notLoggedInContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  notLoggedInText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontFamily: Typography.fontFamily.regular,
  },
  });
};

