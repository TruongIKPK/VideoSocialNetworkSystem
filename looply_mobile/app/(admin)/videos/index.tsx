import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@/contexts/UserContext";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber, getAvatarUri } from "@/utils/imageHelpers";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  url?: string;
  views?: number;
  user: {
    name: string;
    _id: string;
    avatar?: string;
  };
  createdAt: string;
  status?: string;
}

export default function AdminVideosScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { token } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchVideos();
    }
  }, [token]);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      if (!token) {
        console.warn("No token available");
        return;
      }

      const url = `${API_BASE_URL}/admin/videos`;
      console.log(`[Admin Videos] Fetching from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log(`[Admin Videos] Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Admin Videos] Data received:`, data);
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        console.log(`[Admin Videos] Video list length: ${videoList.length}`);
        setVideos(videoList);
      } else {
        const errorText = await response.text();
        console.error(`[Admin Videos] Failed to fetch videos: ${response.status}`, errorText);
        // Try to parse error message if it's JSON
        try {
          const errorData = JSON.parse(errorText);
          console.error(`[Admin Videos] Error details:`, errorData);
        } catch (e) {
          // Not JSON, just log the text
        }
      }
    } catch (error) {
      console.error("[Admin Videos] Error fetching videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVideo = (video: Video) => {
    router.push({
      pathname: "/(admin)/videos/video-detail",
      params: {
        videoId: video._id,
        videoUrl: video.url || video.thumbnail || "",
        title: video.title || "Untitled Video",
        author: video.user?.name || "Unknown",
        views: String(video.views || 0),
        authorId: video.user?._id || "",
      },
    });
  };

  const handleViolation = (video: Video) => {
    // Navigate to video detail for violation reporting
    handleViewVideo(video);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Info Card */}
        <View style={styles.adminCard}>
          <Image
            source={getAvatarUri(user?.avatar)}
            style={styles.avatar}
          />
          <View style={styles.adminTextContainer}>
            <Text style={styles.adminName}>{user?.name || user?.username || "Admin"}</Text>
            <Text style={styles.adminRole}>Bảng quản trị | Mobile</Text>
            {user?.email && (
              <Text style={styles.adminEmail}>{user.email}</Text>
            )}
          </View>
        </View>

        {/* Videos Section */}
        <View style={styles.videosCard}>
          <Text style={styles.videosTitle}>Video gần đây</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : videos.length > 0 ? (
            <View style={styles.videosList}>
              {videos.map((item) => (
                <View key={item._id} style={styles.videoItem}>
                  <View style={styles.videoThumbnail}>
                    <Ionicons name="videocam" size={24} color="#10B981" />
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {item.title || "Untitled Video"}
                    </Text>
                    <Text style={styles.videoMeta}>
                      {item.user?.name || "Unknown"} • {formatNumber(item.views || 0)} lượt xem
                    </Text>
                  </View>
                  <View style={styles.videoActions}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => handleViewVideo(item)}
                    >
                      <Text style={styles.viewButtonText}>Xem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.violationButton}
                      onPress={() => handleViolation(item)}
                    >
                      <Text style={styles.violationButtonText}>Vi phạm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có video nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray[200],
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  adminRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  adminEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  videosCard: {
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  videosTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
  },
  videosList: {
    gap: Spacing.sm,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  videoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 2,
  },
  videoMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  videoActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  viewButton: {
    backgroundColor: "#D1D1D1",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  violationButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  violationButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});

