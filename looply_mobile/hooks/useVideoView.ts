import { useState } from "react";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface UseVideoViewOptions {
  isAuthenticated: boolean;
  token: string | null;
}

export const useVideoView = ({ isAuthenticated, token }: UseVideoViewOptions) => {
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());

  const recordVideoView = async (videoId: string, watchDuration: number) => {
    try {
      if (!isAuthenticated || !token) {
        return;
      }

      if (viewedVideos.has(videoId)) {
        return;
      }

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
        setViewedVideos((prev) => new Set(prev).add(videoId));
      }
    } catch (error) {
      console.error("Record video view error:", error);
    }
  };

  const handleVideoProgress = (videoId: string, duration: number) => {
    recordVideoView(videoId, duration);
  };

  return {
    handleVideoProgress,
  };
};

