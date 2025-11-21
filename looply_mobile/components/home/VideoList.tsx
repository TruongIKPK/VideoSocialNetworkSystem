import React from "react";
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { VideoItem } from "./VideoItem";
import { VideoPost } from "@/types/video";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoListProps {
  videos: VideoPost[];
  currentIndex: number;
  flatListRef: React.RefObject<FlatList | null>;
  onViewableItemsChanged: (info: { viewableItems: any[] }) => void;
  viewabilityConfig: any;
  snapToOffsets: number[];
  onScrollBeginDrag: () => void;
  onScrollEndDrag: (event: any) => void;
  onMomentumScrollEnd: (event: any) => void;
  onLike: (videoId: string) => void;
  onVideoProgress: (videoId: string, duration: number) => void;
  onVideoStart?: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onFollow: (userId: string) => void;
  onSave?: (videoId: string) => void;
  currentUserId: string | null;
  isScreenFocused: boolean;
  isLoadingMore: boolean;
}

export const VideoList = ({
  videos,
  currentIndex,
  flatListRef,
  onViewableItemsChanged,
  viewabilityConfig,
  snapToOffsets,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onLike,
  onVideoProgress,
  onVideoStart,
  onComment,
  onFollow,
  onSave,
  currentUserId,
  isScreenFocused,
  isLoadingMore,
}: VideoListProps) => {
  const renderVideoItem = ({
    item,
    index,
  }: {
    item: VideoPost;
    index: number;
  }) => {
    return (
      <VideoItem
        item={item}
        index={index}
        isCurrent={index === currentIndex}
        onLike={onLike}
        onVideoProgress={onVideoProgress}
        onVideoStart={onVideoStart}
        onComment={onComment}
        onFollow={onFollow}
        onSave={onSave}
        currentUserId={currentUserId}
        isScreenFocused={isScreenFocused}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <View style={styles.loadingMoreContent}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingMoreText}>Đang tải thêm video...</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={videos}
      renderItem={renderVideoItem}
      keyExtractor={(item) => item._id}
      pagingEnabled={false}
      showsVerticalScrollIndicator={false}
      snapToOffsets={snapToOffsets}
      snapToAlignment="start"
      decelerationRate="fast"
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      windowSize={5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      getItemLayout={(data, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
      })}
      ListFooterComponent={renderFooter}
      onScrollToIndexFailed={(info) => {
        const wait = new Promise((resolve) => setTimeout(resolve, 500));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
          });
        });
      }}
    />
  );
};

const styles = StyleSheet.create({
  loadingMoreContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  loadingMoreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[300],
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
});

