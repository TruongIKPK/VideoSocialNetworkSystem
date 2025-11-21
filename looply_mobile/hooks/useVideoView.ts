import { useState } from "react";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface UseVideoViewOptions {
  isAuthenticated: boolean;
  token: string | null;
}

export const useVideoView = ({ isAuthenticated, token }: UseVideoViewOptions) => {
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());

  const recordVideoView = async (videoId: string, watchDuration: number, forceUpdate: boolean = false) => {
    try {
      if (!isAuthenticated || !token) {
        return;
      }

      // Luôn gửi update để backend có thể cập nhật watchDuration
      const completed = watchDuration > 10;

      const response = await fetch(`${API_BASE_URL}/video-views/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          watchDuration,
          completed,
        }),
      });

      if (response.ok) {
        // Thêm vào set để đánh dấu đã record
        setViewedVideos((prev) => new Set(prev).add(videoId));
      }
    } catch (error) {
      console.error("Record video view error:", error);
    }
  };

  // Record video view ngay khi bắt đầu phát
  const recordVideoStart = async (videoId: string) => {
    await recordVideoView(videoId, 1, true);
  };

  const handleVideoProgress = (videoId: string, duration: number) => {
    recordVideoView(videoId, duration);
  };

  return {
    handleVideoProgress,
    recordVideoStart,
  };
};

