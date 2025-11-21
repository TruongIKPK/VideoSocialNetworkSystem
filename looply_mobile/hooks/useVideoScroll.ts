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
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnappedIndexRef = useRef<number>(-1);

  const updateCurrentIndex = (index: number) => {
    setCurrentIndex(index);
    onIndexChange(index);
  };

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

  const handleScrollBeginDrag = () => {
    scrollStartIndexRef.current = currentIndex;
    isScrollingRef.current = true;
    lastSnappedIndexRef.current = -1;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  };

  const handleScroll = (event: any) => {
    if (!isScrollingRef.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const maxOffset = (startIndex + 1) * SCREEN_HEIGHT;
    const minOffset = Math.max(0, (startIndex - 1) * SCREEN_HEIGHT);

    if (offsetY > maxOffset) {
      const targetIndex = Math.min(startIndex + 1, videos.length - 1);
      if (targetIndex !== currentIndex) {
        updateCurrentIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
        });
      }
    } else if (offsetY < minOffset) {
      const targetIndex = Math.max(0, startIndex - 1);
      if (targetIndex !== currentIndex) {
        updateCurrentIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
        });
      }
    }
  };

  const handleScrollEndDrag = (event: any) => {
    isScrollingRef.current = false;
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;

    let targetIndex = startIndex;
    if (offsetY > startOffset + SCREEN_HEIGHT * 0.10) {
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - SCREEN_HEIGHT * 0.10) {
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      targetIndex = startIndex;
    }

    if (targetIndex !== currentIndex) {
      updateCurrentIndex(targetIndex);
    }
    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
    });
  };

  const handleMomentumScrollEnd = (event: any) => {
    isScrollingRef.current = false;
    const offsetY = event.nativeEvent.contentOffset.y;
    const startIndex = scrollStartIndexRef.current;
    const startOffset = startIndex * SCREEN_HEIGHT;

    let targetIndex = startIndex;
    if (offsetY > startOffset + SCREEN_HEIGHT * 0.15) {
      targetIndex = Math.min(startIndex + 1, videos.length - 1);
    } else if (offsetY < startOffset - SCREEN_HEIGHT * 0.15) {
      targetIndex = Math.max(0, startIndex - 1);
    } else {
      targetIndex = startIndex;
    }

    if (targetIndex !== currentIndex) {
      updateCurrentIndex(targetIndex);
    }
    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
    });
  };

  const scrollToIndex = (index: number, animated: boolean = true) => {
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated,
          viewPosition: 0,
        });
        updateCurrentIndex(index);
      } catch (error) {
        console.log(`Error scrolling to index:`, error);
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
    handleScroll,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    scrollToIndex,
  };
};

