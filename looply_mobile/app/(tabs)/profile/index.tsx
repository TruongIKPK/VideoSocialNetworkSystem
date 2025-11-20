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

export default function Profile() {
  const { user: currentUser, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Log tất cả params để debug - params có thể là string hoặc string[]
  useEffect(() => {
    console.log(`[Profile] 📥 All params received:`, params);
    console.log(`[Profile] 📥 Params type:`, {
      userId: typeof params.userId,
      username: typeof params.username,
      userIdValue: params.userId,
      usernameValue: params.username
    });
  }, [params]);
  
  // Xử lý params - expo-router có thể trả về string hoặc string[]
  const targetUserId = Array.isArray(params.userId) 
    ? params.userId[0] 
    : (params.userId as string | undefined);
  const targetUsername = Array.isArray(params.username) 
    ? params.username[0] 
    : (params.username as string | undefined);
  
  // Log params đã parse để debug
  useEffect(() => {
    console.log(`[Profile] 📥 Parsed params:`, { 
      userId: targetUserId, 
      username: targetUsername,
      currentUserId: currentUser?._id,
      hasTargetUserId: !!targetUserId,
      targetUserIdType: typeof targetUserId,
      willViewOtherProfile: targetUserId && targetUserId !== currentUser?._id
    });
  }, [targetUserId, targetUsername, currentUser?._id]);
  
  // Nếu có userId từ params, hiển thị profile của user đó, nếu không thì hiển thị profile của user hiện tại
  const isViewingOtherProfile = targetUserId && targetUserId !== currentUser?._id;
  const [profileUser, setProfileUser] = useState<any>(currentUser);
  
  const [activeTab, setActiveTab] = useState<"video" | "favorites" | "liked">("video");
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [favorites, setFavorites] = useState<VideoPost[]>([]);
  const [liked, setLiked] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log(`[Profile] 🔄 useEffect triggered:`, {
      targetUserId,
      isViewingOtherProfile,
      isAuthenticated,
      hasCurrentUser: !!currentUser
    });

    // Reset state khi params thay đổi
    setVideos([]);
    setFavorites([]);
    setLiked([]);

    if (isViewingOtherProfile && targetUserId) {
      console.log(`[Profile] 👤 Fetching other user profile:`, targetUserId);
      // Fetch profile của user khác
      fetchOtherUserProfile(targetUserId);
    } else if (isAuthenticated && currentUser) {
      console.log(`[Profile] 👤 Showing current user profile`);
      // Hiển thị profile của user hiện tại
      setProfileUser(currentUser);
      fetchProfileData();
    } else {
      console.log(`[Profile] ⚠️ No user data available`);
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser?._id, activeTab, targetUserId, isViewingOtherProfile]);

  const fetchOtherUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log(`[Profile] 🔍 Fetching user profile for ID:`, userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      console.log(`[Profile] 📡 User API response status:`, response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`[Profile] ✅ User data received:`, {
          id: userData._id,
          name: userData.name,
          username: userData.username
        });
        setProfileUser(userData);
        
        // Fetch videos của user đó
        console.log(`[Profile] 🔍 Fetching videos for user:`, userId);
        const videosResponse = await fetch(`${API_BASE_URL}/videos/user/${userId}`);
        console.log(`[Profile] 📡 Videos API response status:`, videosResponse.status);
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          const videosArray = Array.isArray(videosData.videos || videosData) 
            ? (videosData.videos || videosData) 
            : [];
          console.log(`[Profile] ✅ Videos received:`, videosArray.length);
          setVideos(videosArray);
        } else {
          console.warn(`[Profile] ⚠️ Failed to fetch videos:`, videosResponse.status);
          setVideos([]);
        }
      } else {
        console.error(`[Profile] ❌ Failed to fetch user profile:`, response.status);
        setProfileUser(null);
      }
    } catch (error) {
      console.error("[Profile] ❌ Error fetching other user profile:", error);
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = await require("@/utils/tokenStorage").getToken();
      
      if (!token || !currentUser?._id) return;

      // Fetch user videos
      const videosResponse = await fetch(
        `${API_BASE_URL}/videos/user/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setVideos(Array.isArray(videosData.videos || videosData) ? (videosData.videos || videosData) : []);
      }

      // For now, use empty arrays for favorites and liked
      // These would need separate API endpoints
      setFavorites([]);
      setLiked([]);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (isViewingOtherProfile && targetUserId) {
      fetchOtherUserProfile(targetUserId).then(() => {
        setRefreshing(false);
      });
    } else {
      fetchProfileData();
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

<<<<<<< HEAD
  // Chỉ yêu cầu đăng nhập nếu đang xem profile của chính mình
  // Cho phép xem profile của người khác mà không cần đăng nhập
  if (!isViewingOtherProfile && (!isAuthenticated || !currentUser)) {
=======
  if (!isAuthenticated || !currentUser) {
>>>>>>> d9c719dcabff1c3aff8a6e6362d744c61d443a40
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.gray[400]} />
          <Text style={styles.notLoggedInText}>Đăng nhập để xem hồ sơ</Text>
          <Button
            title="Đăng nhập"
            onPress={() => router.push("/login")}
            variant="primary"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Hiển thị loading khi đang fetch data
  if (isLoading && !profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Loading profile..." color={Colors.primary} fullScreen />
      </SafeAreaView>
    );
  }

  // Hiển thị thông báo khi không tìm thấy user (khi đang xem profile người khác)
  if (isViewingOtherProfile && !isLoading && !profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.gray[400]} />
          <Text style={styles.notLoggedInText}>Không tìm thấy người dùng</Text>
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
            {isViewingOtherProfile ? (
              <>
                <Button
                  title="Follow"
                  onPress={() => {
                    // TODO: Implement follow functionality
                    console.log("Follow user:", targetUserId);
                  }}
                  variant="primary"
                  size="sm"
                />
                <Button
                  title="Chia sẻ"
                  onPress={() => {}}
                  variant="ghost"
                  size="sm"
                />
              </>
            ) : (
              <>
                <Button
                  title="Chỉnh sửa"
                  onPress={() => router.push("/(tabs)/settings")}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="Chia sẻ"
                  onPress={() => {}}
                  variant="ghost"
                  size="sm"
                />
              </>
            )}
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

const styles = StyleSheet.create({
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
