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
  
  // Giới hạn số lượng video trong memory để tránh tràn RAM
  const MAX_VIDEOS_IN_MEMORY = 50;

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
        const checkFollowResponse = await fetch(
          `${API_BASE_URL}/users/check-follow?userId=${encodeURIComponent(video.user._id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (checkFollowResponse.ok) {
          const checkFollowData = await checkFollowResponse.json();
          isFollowing = checkFollowData.isFollowing || checkFollowData.followed || false;
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
          
          console.log(`[useVideoList] ✅ Initial load: ${processedVideos.length} videos`);

          // Nếu đã đăng nhập, tự động load thêm video để có đủ nội dung
          if (isAuthenticated && token && processedVideos.length > 0) {
            // Load thêm 2 batch nữa để có đủ video cho user scroll
            const additionalBatches = 2;
            console.log(`[useVideoList] 📥 Auto-loading ${additionalBatches} more batches for authenticated user...`);
            
            // Lưu current loaded IDs để dùng trong closure
            const currentLoadedIds = new Set(newVideoIds);
            
            // Load thêm video trong background (không block UI)
            setTimeout(async () => {
              let accumulatedLoadedIds = new Set(currentLoadedIds);
              
              for (let i = 0; i < additionalBatches; i++) {
                try {
                  const moreResponse = await fetch(
                    `${API_BASE_URL}/video-views/recommended?limit=${BATCH_SIZE}`,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (moreResponse.ok) {
                    const moreData = await moreResponse.json();
                    const moreVideoList = Array.isArray(moreData) ? moreData : (moreData.videos || moreData);

                    if (Array.isArray(moreVideoList) && moreVideoList.length > 0) {
                      const newMoreVideos = moreVideoList.filter(
                        (video: VideoPost) => !accumulatedLoadedIds.has(video._id)
                      );

                      if (newMoreVideos.length > 0) {
                        newMoreVideos.forEach((video: VideoPost) => accumulatedLoadedIds.add(video._id));
                        
                        // Update state
                        setLoadedVideoIds(accumulatedLoadedIds);

                        const processedMoreVideos = await processVideos(newMoreVideos);
                        setVideos((prev) => {
                          const newList = [...prev, ...processedMoreVideos];
                          // Giới hạn số lượng video trong memory
                          if (newList.length > MAX_VIDEOS_IN_MEMORY) {
                            const trimmed = newList.slice(-MAX_VIDEOS_IN_MEMORY);
                            const trimmedIds = new Set(trimmed.map(v => v._id));
                            setLoadedVideoIds(trimmedIds);
                            return trimmed;
                          }
                          return newList;
                        });
                        console.log(`[useVideoList] ✅ Auto-loaded batch ${i + 1}: ${processedMoreVideos.length} videos`);
                      } else {
                        console.log(`[useVideoList] ⚠️ Batch ${i + 1}: All videos are duplicates`);
                      }
                    }
                  }
                } catch (error) {
                  console.error(`[useVideoList] Error auto-loading batch ${i + 1}:`, error);
                }
                
                // Delay giữa các batch để tránh quá tải
                if (i < additionalBatches - 1) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            }, 1000); // Delay 1s sau khi initial load xong
          }
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

  const fetchMoreVideos = async (): Promise<boolean> => {
    if (isLoadingMore) return false;

    setIsLoadingMore(true);
    try {
      // Tăng limit để đảm bảo có đủ video mới sau khi filter
      const fetchLimit = BATCH_SIZE * 3; // Fetch nhiều hơn để có đủ video mới
      
      let url: string;
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && token) {
        url = `${API_BASE_URL}/video-views/recommended?limit=${fetchLimit}`;
        headers.Authorization = `Bearer ${token}`;
      } else {
        url = `${API_BASE_URL}/videos/random?limit=${fetchLimit}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const videoList = Array.isArray(data) ? data : (data.videos || data);

      if (Array.isArray(videoList) && videoList.length > 0) {
        // Filter video chưa load
        const newVideos = videoList.filter(
          (video) => !loadedVideoIds.has(video._id)
        );

        if (newVideos.length > 0) {
          // Chỉ lấy số lượng video cần thiết (BATCH_SIZE)
          const videosToAdd = newVideos.slice(0, BATCH_SIZE);
          
          const newVideoIds = new Set(loadedVideoIds);
          videosToAdd.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          const processedVideos = await processVideos(videosToAdd);
          setVideos((prev) => {
            const newList = [...prev, ...processedVideos];
            // Giới hạn số lượng video trong memory để tránh tràn RAM
            if (newList.length > MAX_VIDEOS_IN_MEMORY) {
              // Giữ lại MAX_VIDEOS_IN_MEMORY video gần nhất
              const trimmed = newList.slice(-MAX_VIDEOS_IN_MEMORY);
              // Cập nhật loadedVideoIds để match với trimmed list
              const trimmedIds = new Set(trimmed.map(v => v._id));
              setLoadedVideoIds(trimmedIds);
              console.log(`[useVideoList] ⚠️ Trimmed videos list from ${newList.length} to ${trimmed.length} to save memory`);
              return trimmed;
            }
            return newList;
          });
          console.log(`[useVideoList] ✅ Loaded ${processedVideos.length} new videos. Total: ${videos.length + processedVideos.length}`);
          return true; // Có video mới
        } else {
          console.log(`[useVideoList] ⚠️ All videos from API are duplicates. Already loaded ${loadedVideoIds.size} videos.`);
          // Nếu không có video mới, thử fetch từ random endpoint
          if (isAuthenticated && token) {
            console.log(`[useVideoList] 🔄 Trying random videos as fallback...`);
            const randomResponse = await fetch(`${API_BASE_URL}/videos/random?limit=${fetchLimit}`, { headers });
            if (randomResponse.ok) {
              const randomData = await randomResponse.json();
              const randomVideoList = Array.isArray(randomData) ? randomData : (randomData.videos || randomData);
              const randomNewVideos = randomVideoList.filter(
                (video: VideoPost) => !loadedVideoIds.has(video._id)
              );
              if (randomNewVideos.length > 0) {
                const randomVideosToAdd = randomNewVideos.slice(0, BATCH_SIZE);
                const randomNewVideoIds = new Set(loadedVideoIds);
                randomVideosToAdd.forEach((video: VideoPost) => randomNewVideoIds.add(video._id));
                setLoadedVideoIds(randomNewVideoIds);
                const processedRandomVideos = await processVideos(randomVideosToAdd);
                setVideos((prev) => {
                  const newList = [...prev, ...processedRandomVideos];
                  // Giới hạn số lượng video trong memory
                  if (newList.length > MAX_VIDEOS_IN_MEMORY) {
                    const trimmed = newList.slice(-MAX_VIDEOS_IN_MEMORY);
                    const trimmedIds = new Set(trimmed.map(v => v._id));
                    setLoadedVideoIds(trimmedIds);
                    console.log(`[useVideoList] ⚠️ Trimmed videos list from ${newList.length} to ${trimmed.length} to save memory`);
                    return trimmed;
                  }
                  return newList;
                });
                console.log(`[useVideoList] ✅ Loaded ${processedRandomVideos.length} random videos. Total: ${videos.length + processedRandomVideos.length}`);
                return true;
              }
            }
          }
          return false; // Không có video mới
        }
      } else {
        console.log(`[useVideoList] ⚠️ No videos returned from API`);
        return false; // Không có video mới
      }
    } catch (error) {
      console.error("Fetch more videos error:", error);
      return false;
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

