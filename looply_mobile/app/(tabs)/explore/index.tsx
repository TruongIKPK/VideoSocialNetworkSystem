import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getThumbnailUri, formatNumber } from "@/utils/imageHelpers";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Loading } from "@/components/ui/Loading";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - Spacing.md * 3) / 2;
const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface VideoPost {
  _id: string;
  url: string;
  thumbnail: string;
  title: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  likes?: number;
  views?: number;
  createdAt: string;
}

const categories = [
  { id: "all", name: "Tất cả", icon: "grid" },
  { id: "trending", name: "Thịnh hành", icon: "flame" },
  { id: "music", name: "Âm nhạc", icon: "musical-notes" },
  { id: "comedy", name: "Hài kịch", icon: "happy" },
  { id: "dance", name: "Nhảy múa", icon: "body" },
  { id: "sports", name: "Thể thao", icon: "football" },
];

export default function ExploreScreen() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const url = selectedCategory === "trending"
        ? `${API_BASE_URL}/videos/trending`
        : `${API_BASE_URL}/videos/random?limit=20`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const videoList = data.videos || data;
        setVideos(Array.isArray(videoList) ? videoList : []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const renderVideoItem = ({ item }: { item: VideoPost }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => {
        // Navigate to video detail or play video
        router.push(`/(tabs)/home`);
      }}
      activeOpacity={0.8}
    >
      <Image
        source={getThumbnailUri(item.thumbnail)}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.videoOverlay}>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.videoMeta}>
            <Text style={styles.videoUser}>{item.user.name}</Text>
            <View style={styles.videoStats}>
              <Ionicons name="eye-outline" size={12} color={Colors.white} />
              <Text style={styles.statsText}>
                {formatNumber(item.views || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && videos.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Loading message="Loading videos..." color={Colors.primary} fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
      <TouchableOpacity 
        onPress={() => router.push("/search")}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={24} color="#000" />
      </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.categoryItemActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={
                  selectedCategory === item.id
                    ? Colors.primary
                    : Colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Video Grid */}
      <FlatList
        data={videos}
        numColumns={2}
        keyExtractor={(item) => item._id}
        renderItem={renderVideoItem}
        contentContainerStyle={[styles.videoGrid, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={64} color={Colors.gray[400]} />
            <Text style={styles.emptyText}>Không có video nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  categoriesContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.gray[50],
    gap: Spacing.xs,
  },
  categoryItemActive: {
    backgroundColor: Colors.primaryLight + "20",
  },
  categoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  videoGrid: {
    padding: Spacing.md,
  },
  videoItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.4,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.gray[200],
    ...Shadows.md,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: Spacing.sm,
  },
  videoInfo: {
    gap: Spacing.xs,
  },
  videoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.medium,
  },
  videoMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoUser: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  videoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
  },
  statsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    flex: 1,
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
});
