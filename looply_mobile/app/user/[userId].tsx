import React, { useState, useEffect } from "react";
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
import { useUser } from "@/contexts/UserContext";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";

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

export default function OtherUserProfile() {
  const { user: currentUser } = useCurrentUser();
  const { token, isAuthenticated } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const username = params.username as string | undefined;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"video" | "favorites" | "liked">("video");
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [favorites, setFavorites] = useState<VideoPost[]>([]);
  const [liked, setLiked] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setProfileUser(userData);
        
        // Fetch videos của user đó
        const videosResponse = await fetch(`${API_BASE_URL}/videos/user/${userId}`);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setVideos(Array.isArray(videosData.videos || videosData) ? (videosData.videos || videosData) : []);
        }
        
        // Fetch total likes received
        const totalLikesResponse = await fetch(
          `${API_BASE_URL}/users/${userId}/total-likes`
        );
        if (totalLikesResponse.ok) {
          const totalLikesData = await totalLikesResponse.json();
          setTotalLikes(totalLikesData.totalLikes || 0);
        }

        // Check follow status
        if (isAuthenticated && token && currentUser?._id) {
          checkFollowStatus();
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/check-follow?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing || data.followed || false);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !token || !currentUser?._id) {
      return;
    }

    setIsLoadingFollow(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);

    try {
      const method = wasFollowing ? "DELETE" : "POST";
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}/follow`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${wasFollowing ? "unfollow" : "follow"} user`);
      }

      // Update followers count
      if (response.ok) {
        setProfileUser((prev: any) => ({
          ...prev,
          followers: wasFollowing ? (prev.followers || 0) - 1 : (prev.followers || 0) + 1,
        }));
      }
    } catch (error) {
      console.error("Follow error:", error);
      // Revert on error
      setIsFollowing(wasFollowing);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile().finally(() => setRefreshing(false));
  };

  const renderVideoItem = ({ item }: { item: VideoPost }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => router.push({
        pathname: "/(tabs)/home",
        params: { videoId: item._id, scrollToVideo: "true" },
      })}
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Loading profile..." color={Colors.primary} fullScreen />
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.gray[400]} />
          <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <Image
            source={getAvatarUri(profileUser?.avatar)}
            style={styles.avatar}
            contentFit="cover"
          />

          <Text style={styles.username}>{profileUser?.name || profileUser?.username || "User"}</Text>
          {profileUser?.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}

          {/* Follow Button */}
          {isAuthenticated && currentUser?._id !== userId && (
            <View style={styles.buttonContainer}>
              <Button
                title={isFollowing ? "Đang follow" : "Follow"}
                onPress={handleFollow}
                variant={isFollowing ? "outline" : "primary"}
                size="sm"
                loading={isLoadingFollow}
                disabled={isLoadingFollow}
              />
              <Button
                title="Chia sẻ"
                onPress={() => {}}
                variant="ghost"
                size="sm"
              />
            </View>
          )}

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
                {formatNumber(totalLikes)}
              </Text>
              <Text style={styles.statLabel}>Lượt thích</Text>
            </View>
          </View>
        </View>

        {/* Tab Bar - Fixed at top */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  backButton: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 10,
    padding: Spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.round,
    ...Shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    position: "relative",
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    marginTop: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontFamily: Typography.fontFamily.regular,
  },
});

