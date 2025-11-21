import { useState, useEffect } from "react";
import { VideoPost } from "@/types/video";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";
const BATCH_SIZE = 3;

interface UseVideoListOptions {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
}

export const useVideoList = ({
  isAuthenticated,
  token,
  userId,
}: UseVideoListOptions) => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedVideoIds, setLoadedVideoIds] = useState<Set<string>>(new Set());

  // Check like status for a video
  const checkLikeStatus = async (video: VideoPost): Promise<VideoPost> => {
    let likedBy = video.likedBy || [];
    if (!Array.isArray(likedBy)) {
      likedBy = [];
    }

    if (isAuthenticated && token && userId) {
      try {
        const checkResponse = await fetch(
          `${API_BASE_URL}/likes/check?userId=${encodeURIComponent(userId)}&targetType=video&targetId=${encodeURIComponent(video._id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.isLiked || checkData.liked) {
            if (!likedBy.includes(userId)) {
              likedBy = [...likedBy, userId];
            }
          } else {
            likedBy = likedBy.filter((id: string) => id !== userId);
          }
        }
      } catch (error) {
        console.error(`Error checking like status for video ${video._id}:`, error);
      }
    }

    return { ...video, likedBy };
  };

  // Check follow status for a video's user
  const checkFollowStatus = async (video: VideoPost): Promise<VideoPost> => {
    let isFollowing = false;
    if (video.user && video.user._id && video.user._id !== userId && isAuthenticated && token && userId) {
      try {
        const userResponse = await fetch(
          `${API_BASE_URL}/users/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.followingList && Array.isArray(userData.followingList)) {
            isFollowing = userData.followingList.some(
              (id: string) => String(id) === String(video.user._id)
            );
          }
        }
      } catch (error) {
        console.error(`Error checking follow status for user ${video.user._id}:`, error);
      }
    }

    return { ...video, isFollowing };
  };

  // Process videos: check like and follow status
  const processVideos = async (videoList: VideoPost[]): Promise<VideoPost[]> => {
    if (!isAuthenticated || !token || !userId) {
      return videoList.map((video) => ({
        ...video,
        likedBy: [],
        isFollowing: false,
      }));
    }

    return Promise.all(
      videoList.map(async (video) => {
        const withLikeStatus = await checkLikeStatus(video);
        return checkFollowStatus(withLikeStatus);
      })
    );
  };

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    setLoadedVideoIds(new Set());

    try {
      let url: string;
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        url = `${API_BASE_URL}/video-views/recommended?limit=${BATCH_SIZE}`;
        headers.Authorization = `Bearer ${token}`;
      } else {
        url = `${API_BASE_URL}/videos/latest`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const videoList = Array.isArray(data) ? data : (data.videos || data);

      if (Array.isArray(videoList) && videoList.length > 0) {
        const uniqueVideos = videoList.filter(
          (video) => !loadedVideoIds.has(video._id)
        );

        if (uniqueVideos.length > 0) {
          const newVideoIds = new Set(loadedVideoIds);
          uniqueVideos.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          const processedVideos = await processVideos(uniqueVideos);
          setVideos(processedVideos);
        } else {
          setError("No new videos available");
        }
      } else {
        setError("No videos available");
      }
    } catch (error) {
      console.error("Fetch videos error:", error);
      setError("Failed to load videos. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMoreVideos = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      let url: string;
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        url = `${API_BASE_URL}/video-views/recommended?limit=${BATCH_SIZE}`;
        headers.Authorization = `Bearer ${token}`;
      } else {
        url = `${API_BASE_URL}/videos/random?limit=${BATCH_SIZE}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const videoList = Array.isArray(data) ? data : (data.videos || data);

      if (Array.isArray(videoList) && videoList.length > 0) {
        const newVideos = videoList.filter(
          (video) => !loadedVideoIds.has(video._id)
        );

        if (newVideos.length > 0) {
          const newVideoIds = new Set(loadedVideoIds);
          newVideos.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          const processedVideos = await processVideos(newVideos);
          setVideos((prev) => [...prev, ...processedVideos]);
        }
      }
    } catch (error) {
      console.error("Fetch more videos error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [isAuthenticated]);

  return {
    videos,
    setVideos,
    isLoading,
    isLoadingMore,
    error,
    fetchVideos,
    fetchMoreVideos,
    BATCH_SIZE,
  };
};

