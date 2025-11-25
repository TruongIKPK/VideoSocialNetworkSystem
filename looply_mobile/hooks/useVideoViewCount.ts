import { useState, useEffect, useRef } from "react";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface VideoViewCount {
  videoId: string;
  viewCount: number;
  completedCount: number;
}

// Cache để tránh fetch nhiều lần cho cùng một video
const viewCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const useVideoViewCount = (videoId: string | null | undefined) => {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!videoId) {
      setViewCount(null);
      return;
    }

    // Kiểm tra cache trước
    const cached = viewCountCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setViewCount(cached.count);
      return;
    }

    // Hủy request trước đó nếu có
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Tạo AbortController mới
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchViewCount = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/video-views/count/${videoId}`,
          { signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch view count: ${response.status}`);
        }

        const data: VideoViewCount = await response.json();
        
        // Cập nhật cache
        viewCountCache.set(videoId, {
          count: data.viewCount,
          timestamp: Date.now(),
        });

        setViewCount(data.viewCount);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Request bị hủy, không cần xử lý
          return;
        }
        console.error(`[useVideoViewCount] Error fetching view count for ${videoId}:`, err);
        setError(err.message);
        // Nếu có cache cũ, vẫn dùng nó
        if (cached) {
          setViewCount(cached.count);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewCount();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [videoId]);

  return { viewCount, isLoading, error };
};

// Utility function để fetch view count cho nhiều video cùng lúc (dùng trong profile)
export const fetchVideoViewCounts = async (
  videoIds: string[]
): Promise<Map<string, number>> => {
  const viewCounts = new Map<string, number>();
  const uncachedIds: string[] = [];

  // Kiểm tra cache trước
  videoIds.forEach((videoId) => {
    const cached = viewCountCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      viewCounts.set(videoId, cached.count);
    } else {
      uncachedIds.push(videoId);
    }
  });

  // Fetch các video chưa có trong cache
  if (uncachedIds.length > 0) {
    try {
      // Fetch từng video (có thể tối ưu thành batch API sau)
      const promises = uncachedIds.map(async (videoId) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/video-views/count/${videoId}`
          );

          if (response.ok) {
            const data: VideoViewCount = await response.json();
            viewCountCache.set(videoId, {
              count: data.viewCount,
              timestamp: Date.now(),
            });
            return { videoId, count: data.viewCount };
          }
        } catch (error) {
          console.error(`[fetchVideoViewCounts] Error for ${videoId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.forEach((result) => {
        if (result) {
          viewCounts.set(result.videoId, result.count);
        }
      });
    } catch (error) {
      console.error("[fetchVideoViewCounts] Error:", error);
    }
  }

  return viewCounts;
};

// Function để invalidate cache (khi video được xem)
export const invalidateViewCountCache = (videoId: string) => {
  viewCountCache.delete(videoId);
};

