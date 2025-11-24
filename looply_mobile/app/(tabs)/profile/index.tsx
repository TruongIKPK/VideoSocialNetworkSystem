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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAvatarUri, formatNumber } from "@/utils/imageHelpers";
import {
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
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
  type?: 'video' | 'image';
}

const createStyles = (Colors: ReturnType<typeof useColors>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.gray,
    },
  scrollView: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    borderRadius: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
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
    width: "60%", 
    justifyContent: "center",
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  videoItemWrapper: {
    width: itemWidth,
    marginHorizontal: 2.5,
    marginBottom: Spacing.sm,
  },
  videoItemContainer: {
    position: "relative",
    width: "100%",
  },
  videoItem: {
    width: "100%",
    height: itemWidth * 1.4,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: BorderRadius.round,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
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

export default function Profile() {
  const { user: currentUser, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const Colors = useColors(); // Get theme-aware colors
  
  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  
  
  // Xử lý params - expo-router có thể trả về string hoặc string[]
  const targetUserId = Array.isArray(params.userId) 
    ? params.userId[0] 
    : (params.userId as string | undefined);
  const targetUsername = Array.isArray(params.username) 
    ? params.username[0] 
    : (params.username as string | undefined);
  
  
  // Nếu có userId từ params, hiển thị profile của user đó, nếu không thì hiển thị profile của user hiện tại
  const isViewingOtherProfile = targetUserId && targetUserId !== currentUser?._id;
  const [profileUser, setProfileUser] = useState<any>(currentUser);

  const [activeTab, setActiveTab] = useState<"video" | "saved" | "liked">(
    "video"
  );
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [saved, setSaved] = useState<VideoPost[]>([]);
  const [liked, setLiked] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Reset state khi params thay đổi
    setVideos([]);
    setLiked([]);

    if (isViewingOtherProfile && targetUserId) {
      // Fetch profile của user khác
      fetchOtherUserProfile(targetUserId);
    } else if (isAuthenticated && currentUser) {
      // Hiển thị profile của user hiện tại
      setProfileUser(currentUser);
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    currentUser,
    activeTab,
    targetUserId,
    isViewingOtherProfile,
  ]);

  const fetchOtherUserProfile = async (userId: string) => {
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
          const videosArray = Array.isArray(videosData.videos || videosData) 
            ? (videosData.videos || videosData) 
            : [];
          setVideos(videosArray);
        } else {
          setVideos([]);
        }
      } else {
        setProfileUser(null);
      }
    } catch (error) {
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTabData = async () => {
    try {
      const token = await require("@/utils/tokenStorage").getToken();
      if (!token || !currentUser?._id) return;

      if (activeTab === "video") {
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
          setVideos(
            Array.isArray(videosData.videos || videosData)
              ? videosData.videos || videosData
              : []
          );
        }

      } else if (activeTab === "saved") {
        const savedResponse = await fetch(
          `${API_BASE_URL}/videos/saved/${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          setSaved(
            Array.isArray(savedData.videos || savedData)
              ? savedData.videos || savedData
              : []
          );
        }
      } else if (activeTab === "liked") {
        const likedResponse = await fetch(
          `${API_BASE_URL}/videos/liked/${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (likedResponse.ok) {
          const likedData = await likedResponse.json();
          setLiked(
            Array.isArray(likedData.videos || likedData)
              ? likedData.videos || likedData
              : []
          );
        }
      }
    } catch (error) {
      // Error fetching tab data
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

      // Fetch total likes received
      const totalLikesResponse = await fetch(
        `${API_BASE_URL}/users/${currentUser._id}/total-likes`
      );
      if (totalLikesResponse.ok) {
        const totalLikesData = await totalLikesResponse.json();
        setTotalLikes(totalLikesData.totalLikes || 0);
      }

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setVideos(
          Array.isArray(videosData.videos || videosData)
            ? videosData.videos || videosData
            : []
        );
      }


      // Fetch saved videos
      const savedResponse = await fetch(
        `${API_BASE_URL}/videos/saved/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSaved(
          Array.isArray(savedData.videos || savedData)
            ? savedData.videos || savedData
            : []
        );
      }

      // Fetch liked videos
      const likedResponse = await fetch(
        `${API_BASE_URL}/videos/liked/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (likedResponse.ok) {
        const likedData = await likedResponse.json();
        setLiked(
          Array.isArray(likedData.videos || likedData)
            ? likedData.videos || likedData
            : []
        );
      }
    } catch (error) {
      // Error fetching profile data
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

  const handleDeleteVideo = async (videoId: string) => {
    Alert.alert(
      "Xóa video",
      "Bạn có chắc chắn muốn xóa video này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingVideoId(videoId);
              const token = await require("@/utils/tokenStorage").getToken();
              if (!token) {
                Alert.alert("Lỗi", "Vui lòng đăng nhập để xóa video");
                return;
              }

              const response = await fetch(
                `${API_BASE_URL}/videos/${videoId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                // Xóa video khỏi tất cả các danh sách (videos, saved, liked)
                setVideos((prev) => prev.filter((v) => v._id !== videoId));
                setSaved((prev) => prev.filter((v) => v._id !== videoId));
                setLiked((prev) => prev.filter((v) => v._id !== videoId));
                
                Alert.alert("Thành công", "Đã xóa video");
              } else {
                const errorData = await response.json().catch(() => ({ message: "Không thể xóa video" }));
                const errorMessage = errorData.message || `Lỗi: ${response.status}`;
                
                if (response.status === 403) {
                  Alert.alert("Không có quyền", "Bạn chỉ có thể xóa video của chính mình");
                } else if (response.status === 404) {
                  Alert.alert("Không tìm thấy", "Video không tồn tại hoặc đã bị xóa");
                } else {
                  Alert.alert("Lỗi", errorMessage);
                }
              }
            } catch (error) {
              // Error deleting video
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa video. Vui lòng thử lại.");
            } finally {
              setDeletingVideoId(null);
            }
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: VideoPost }) => {
    const isOwnVideo = activeTab === "video" && !isViewingOtherProfile;
    
    return (
      <View style={styles.videoItemContainer}>
        <TouchableOpacity
          style={styles.videoItem}
          onPress={() => router.push("/(tabs)/home")}
          activeOpacity={0.8}
        >
          <Image
            source={getAvatarUri(item.thumbnail || item.url)}
            style={styles.videoThumbnail}
            contentFit="cover"
          />
          <View style={styles.videoOverlay}>
            <View style={styles.videoStats}>
              <Ionicons name="eye-outline" size={12} color={Colors.white} />
              <Text style={styles.videoStatsText}>
                {formatNumber(item.views || 0)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {isOwnVideo && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteVideo(item._id)}
            disabled={deletingVideoId === item._id}
          >
            {deletingVideoId === item._id ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={Colors.white} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Chỉ yêu cầu đăng nhập nếu đang xem profile của chính mình
  // Cho phép xem profile của người khác mà không cần đăng nhập
  if (!isViewingOtherProfile && (!isAuthenticated || !currentUser)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={Colors.gray[400]}
          />
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
        <Loading
          message="Loading profile..."
          color={Colors.primary}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const currentVideos =
    activeTab === "video"
      ? videos
      : activeTab === "saved"
      ? saved
      : liked;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

          <Text style={styles.username}>
            {profileUser?.name || profileUser?.username || "User"}
          </Text>
          {profileUser?.bio && (
            <Text style={styles.bio}>{profileUser.bio}</Text>
          )}

          <View style={styles.buttonContainer}>
            {isViewingOtherProfile ? (
              <>
                <Button
                  title="Follow"
                  onPress={() => {
                    // TODO: Implement follow functionality
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
                {formatNumber(
                  videos.reduce((sum, v) => sum + (v.likes || 0), 0)
                )}
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
                color={
                  activeTab === "video" ? Colors.primary : Colors.gray[400]
                }
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
              style={[
                styles.tab,
                activeTab === "saved" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("saved")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={
                  activeTab === "saved" ? Colors.primary : Colors.gray[400]
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "saved" && styles.activeTabText,
                ]}
              >
                Đã lưu
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
                color={
                  activeTab === "liked" ? Colors.primary : Colors.gray[400]
                }
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
              name={
                activeTab === "video"
                  ? "videocam-off-outline"
                  : "bookmark-outline"
              }
              size={64}
              color={Colors.gray[400]}
            />
            <Text style={styles.emptyText}>
              {activeTab === "video"
                ? "Chưa có video nào"
                : activeTab === "saved"
                ? "Chưa có video đã lưu"
                : "Chưa có video đã thích"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
