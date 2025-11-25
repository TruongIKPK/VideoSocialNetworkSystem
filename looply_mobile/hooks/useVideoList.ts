import { useState, useEffect, useRef } from "react";
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
  const isAutoLoadingRef = useRef(false); // Ref để track auto-loading state
  const autoLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Ref để lưu timeout ID
  const hasFetchedRef = useRef(false); // Ref để track xem đã fetch lần đầu chưa
  const lastIsAuthenticatedRef = useRef<boolean | null>(null); // Ref để track giá trị isAuthenticated trước đó
  const isLoadingRef = useRef(false); // Ref để track loading state để tránh race condition
  const lastFetchTimeRef = useRef<number>(0); // Ref để track thời gian fetch lần cuối
  const FETCH_DEBOUNCE_MS = 500; // Debounce 0.5 giây (giảm từ 1.5s để reload nhanh hơn)
  
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
    
    // Chỉ kiểm tra nếu:
    // 1. Video có user info
    // 2. User của video khác với current user
    // 3. User đã đăng nhập
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
          console.log(`[useVideoList] ✅ Follow status for user ${video.user._id}: ${isFollowing}`);
        } else {
          const errorText = await checkFollowResponse.text().catch(() => 'Unknown error');
          console.warn(`[useVideoList] ⚠️ Failed to check follow status for user ${video.user._id}: ${checkFollowResponse.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`[useVideoList] ❌ Error checking follow status for user ${video.user._id}:`, error);
      }
    } else {
      // Nếu không đủ điều kiện, set isFollowing = false
      if (video.user && video.user._id === userId) {
        console.log(`[useVideoList] ℹ️ Skipping follow check: video owner is current user`);
      } else if (!isAuthenticated || !token || !userId) {
        console.log(`[useVideoList] ℹ️ Skipping follow check: user not authenticated`);
      }
    }

    return { ...video, isFollowing };
  };

  // Check save status for a video
  const checkSaveStatus = async (video: VideoPost): Promise<VideoPost> => {
    let savedBy = video.savedBy || [];
    if (!Array.isArray(savedBy)) {
      savedBy = [];
    }

    if (isAuthenticated && token && userId) {
      try {
        const checkResponse = await fetch(
          `${API_BASE_URL}/saves/check?userId=${encodeURIComponent(userId)}&videoId=${encodeURIComponent(video._id)}`,
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
          if (checkData.isSaved || checkData.saved) {
            if (!savedBy.includes(userId)) {
              savedBy = [...savedBy, userId];
            }
          } else {
            savedBy = savedBy.filter((id: string) => id !== userId);
          }
        }
      } catch (error) {
        console.error(`Error checking save status for video ${video._id}:`, error);
      }
    }

    return { ...video, savedBy };
  };

  // Process videos: check like, follow and save status
  const processVideos = async (videoList: VideoPost[]): Promise<VideoPost[]> => {
    if (!isAuthenticated || !token || !userId) {
      return videoList.map((video) => ({
        ...video,
        likedBy: [],
        savedBy: [],
        isFollowing: false,
      }));
    }

    return Promise.all(
      videoList.map(async (video) => {
        const withLikeStatus = await checkLikeStatus(video);
        const withFollowStatus = await checkFollowStatus(withLikeStatus);
        return checkSaveStatus(withFollowStatus);
      })
    );
  };

  const fetchVideos = async (isManualReload: boolean = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Ngăn fetch nếu đang loading để tránh vòng lặp
    if (isLoadingRef.current) {
      console.log(`[useVideoList] ⚠️ Already loading, skipping fetch`);
      return;
    }
    
    // Ngăn fetch nếu vừa mới fetch gần đây (debounce) - TRỪ KHI là manual reload
    if (!isManualReload && timeSinceLastFetch < FETCH_DEBOUNCE_MS && hasFetchedRef.current) {
      console.log(`[useVideoList] ⚠️ Fetch too soon (${timeSinceLastFetch}ms < ${FETCH_DEBOUNCE_MS}ms), skipping`);
      return;
    }
    
    console.log(`[useVideoList] 🚀 Starting fetchVideos${isManualReload ? ' (manual reload)' : ''}`);
    lastFetchTimeRef.current = now;
    
    // Hủy auto-load timeout nếu đang chạy
    if (autoLoadTimeoutRef.current) {
      clearTimeout(autoLoadTimeoutRef.current);
      autoLoadTimeoutRef.current = null;
    }
    isAutoLoadingRef.current = false;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    // Khi manual reload, reset loadedVideoIds để accept tất cả videos mới
    if (isManualReload) {
      setLoadedVideoIds(new Set());
    }
    
    hasFetchedRef.current = true;

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
        // Khi manual reload, accept tất cả videos (không filter)
        // Khi initial load, filter dựa trên loadedVideoIds
        const uniqueVideos = isManualReload 
          ? videoList  // Manual reload: accept tất cả
          : videoList.filter((video) => !loadedVideoIds.has(video._id));  // Initial load: filter duplicates

        if (uniqueVideos.length > 0) {
          const newVideoIds = new Set(loadedVideoIds);
          uniqueVideos.forEach((video) => newVideoIds.add(video._id));
          setLoadedVideoIds(newVideoIds);

          const processedVideos = await processVideos(uniqueVideos);
          setVideos(processedVideos);
          
          console.log(`[useVideoList] ✅ Initial load: ${processedVideos.length} videos`);

          // Nếu đã đăng nhập, tự động load thêm video để có đủ nội dung
          // Chỉ auto-load nếu chưa đang auto-load
          if (isAuthenticated && token && processedVideos.length > 0 && !isAutoLoadingRef.current) {
            isAutoLoadingRef.current = true;
            // Load thêm 2 batch nữa để có đủ video cho user scroll
            const additionalBatches = 2;
            console.log(`[useVideoList] 📥 Auto-loading ${additionalBatches} more batches for authenticated user...`);
            
            // Lưu current loaded IDs để dùng trong closure
            const currentLoadedIds = new Set(newVideoIds);
            
            // Load thêm video trong background (không block UI)
            autoLoadTimeoutRef.current = setTimeout(async () => {
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
                        // Nếu tất cả đều là duplicates, dừng auto-load
                        break;
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
              
              isAutoLoadingRef.current = false;
              autoLoadTimeoutRef.current = null;
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
      isLoadingRef.current = false;
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
    // CHỈ fetch tự động nếu:
    // 1. Chưa fetch lần nào (lần đầu load trang), HOẶC
    // 2. isAuthenticated thay đổi thực sự (từ false -> true hoặc true -> false)
    // VÀ không đang loading (kiểm tra qua ref để tránh dependency loop)
    // LƯU Ý: Đây là fetch tự động, KHÔNG phải reload thủ công từ icon home
    const shouldFetch = (!hasFetchedRef.current || 
                         (lastIsAuthenticatedRef.current !== null && 
                          lastIsAuthenticatedRef.current !== isAuthenticated));
    
    if (shouldFetch && !isLoadingRef.current) {
      console.log(`[useVideoList] 🔄 Auto-fetch (initial load or auth change), NOT manual reload`);
      lastIsAuthenticatedRef.current = isAuthenticated;
      fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Chỉ depend vào isAuthenticated, không depend vào isLoading để tránh loop

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

