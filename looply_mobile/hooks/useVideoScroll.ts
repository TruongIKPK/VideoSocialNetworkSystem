import { useRef, useState } from "react";
import { FlatList, Dimensions } from "react-native";
import { VideoPost } from "@/types/video";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface UseVideoScrollOptions {
  videos: VideoPost[];
  onIndexChange: (index: number) => void;
}

export const useVideoScroll = ({
  videos,
  onIndexChange,
}: UseVideoScrollOptions) => {
  const flatListRef = useRef<FlatList | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollStartIndexRef = useRef<number>(0);

  const updateCurrentIndex = (index: number) => {
    setCurrentIndex(index);
    onIndexChange(index);
  };

  // Track index thông qua onViewableItemsChanged
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      if (visibleIndex !== null && visibleIndex !== undefined) {
        updateCurrentIndex(visibleIndex);
      }
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const snapToOffsets = videos.map((_, index) => index * SCREEN_HEIGHT);

  // Lưu index khi bắt đầu scroll
  const handleScrollBeginDrag = () => {
    scrollStartIndexRef.current = currentIndex;
  };

  // Kiểm soát tốc độ cuộn với threshold khi kết thúc drag
  const handleScrollEndDrag = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;
    const threshold = SCREEN_HEIGHT * 0.10; // 10% threshold để giảm tốc độ cuộn

    let targetIndex = startIndex;
    if (offsetY > startOffset + threshold) {
      // Scroll xuống đủ xa - chuyển sang video bên dưới
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - threshold) {
      // Scroll lên đủ xa - chuyển sang video bên trên
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      // Scroll chưa đủ xa - quay về video hiện tại
      targetIndex = startIndex;
    }

    // Đảm bảo targetIndex hợp lệ
    if (targetIndex >= 0 && targetIndex < videos.length && targetIndex !== currentIndex) {
      scrollToIndex(targetIndex, true);
    }
  };

  // Kiểm soát tốc độ cuộn với threshold khi momentum scroll kết thúc
  const handleMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;
    const threshold = SCREEN_HEIGHT * 0.15; // 15% threshold cho momentum scroll

    let targetIndex = startIndex;
    if (offsetY > startOffset + threshold) {
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - threshold) {
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      targetIndex = startIndex;
    }

    // Đảm bảo targetIndex hợp lệ
    if (targetIndex >= 0 && targetIndex < videos.length && targetIndex !== currentIndex) {
      scrollToIndex(targetIndex, true);
    }
  };

  // Scroll đến index cụ thể
  const scrollToIndex = (index: number, animated: boolean = true) => {
    if (flatListRef.current && index >= 0 && index < videos.length) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated,
          viewPosition: 0,
        });
        updateCurrentIndex(index);
      } catch (error) {
        // Fallback: scroll to offset
        const offset = index * SCREEN_HEIGHT;
        flatListRef.current.scrollToOffset({
          offset,
          animated,
        });
        updateCurrentIndex(index);
      }
    }
  };

  return {
    flatListRef,
    currentIndex,
    setCurrentIndex: updateCurrentIndex,
    onViewableItemsChanged,
    viewabilityConfig,
    snapToOffsets,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    scrollToIndex,
  };
};

