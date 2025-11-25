import { useRouter } from "expo-router";
import { VideoPost } from "@/types/video";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface UseVideoActionsOptions {
  videos: VideoPost[];
  setVideos: React.Dispatch<React.SetStateAction<VideoPost[]>>;
  userId: string | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const useVideoActions = ({
  videos,
  setVideos,
  userId,
  isAuthenticated,
  token,
}: UseVideoActionsOptions) => {
  const router = useRouter();

  const handleLike = async (videoId: string) => {
    if (!userId || !isAuthenticated || !token) {
      return;
    }

    const currentVideo = videos.find((v) => v._id === videoId);
    if (!currentVideo) return;

    const isCurrentlyLiked = currentVideo.likedBy.includes(userId);
    const currentLikes = currentVideo.likes || currentVideo.likesCount || 0;

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id === videoId) {
          return {
            ...video,
            likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likesCount: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
            likedBy: isCurrentlyLiked
              ? video.likedBy.filter((id) => id !== userId)
              : [...video.likedBy, userId],
          };
        }
        return video;
      })
    );

    try {
      const endpoint = isCurrentlyLiked ? "unlike" : "like";
      const response = await fetch(`${API_BASE_URL}/likes/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          targetType: "video",
          targetId: videoId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} video`);
      }
    } catch (error) {
      console.error("Like error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((video) => {
          if (video._id === videoId) {
            return {
              ...video,
              likes: currentLikes,
              likesCount: currentLikes,
              likedBy: currentVideo.likedBy,
            };
          }
          return video;
        })
      );
    }
  };

  const handleComment = (videoId: string) => {
    router.push({
      pathname: "/(tabs)/home/comments",
      params: { videoId },
    });
  };

  const handleFollow = async (targetUserId: string) => {
    if (!userId || !isAuthenticated || !token || userId === targetUserId) {
      return;
    }

    const video = videos.find((v) => v.user._id === targetUserId);
    if (!video) return;

    const isCurrentlyFollowing = video.isFollowing || false;

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((v) => {
        if (v.user._id === targetUserId) {
          return {
            ...v,
            isFollowing: !isCurrentlyFollowing,
          };
        }
        return v;
      })
    );

    try {
      const method = isCurrentlyFollowing ? "DELETE" : "POST";
      const response = await fetch(
        `${API_BASE_URL}/users/${targetUserId}/follow`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Log error nhưng không hiển thị alert
        console.warn("Follow/unfollow error:", errorData.message || "Failed to follow/unfollow user");
        // Revert on error
        setVideos((prev) =>
          prev.map((v) => {
            if (v.user._id === targetUserId) {
              return {
                ...v,
                isFollowing: isCurrentlyFollowing,
              };
            }
            return v;
          })
        );
      }
    } catch (error) {
      // Log error nhưng không hiển thị alert
      console.warn("Follow/unfollow error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((v) => {
          if (v.user._id === targetUserId) {
            return {
              ...v,
              isFollowing: isCurrentlyFollowing,
            };
          }
          return v;
        })
      );
    }
  };

  const handleSave = async (videoId: string) => {
    if (!userId || !isAuthenticated || !token) {
      return;
    }

    const currentVideo = videos.find((v) => v._id === videoId);
    if (!currentVideo) return;

    // Đảm bảo savedBy luôn là array
    const savedByArray = currentVideo.savedBy || [];
    const isCurrentlySaved = savedByArray.includes(userId);
    const currentSaves = currentVideo.saves || currentVideo.savesCount || 0;

    // Optimistic UI update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id === videoId) {
          const newSavedBy = isCurrentlySaved
            ? savedByArray.filter((id) => id !== userId)
            : [...savedByArray, userId];
          
          return {
            ...video,
            saves: isCurrentlySaved ? currentSaves - 1 : currentSaves + 1,
            savesCount: isCurrentlySaved ? currentSaves - 1 : currentSaves + 1,
            savedBy: newSavedBy,
          };
        }
        return video;
      })
    );

    try {
      const endpoint = isCurrentlySaved ? "unsave" : "save";
      const response = await fetch(`${API_BASE_URL}/saves/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${endpoint} video`);
      }

      // Không cần update lại vì đã optimistic update
      console.log(`✅ Video ${isCurrentlySaved ? 'unsaved' : 'saved'} successfully`);
    } catch (error) {
      console.error("Save error:", error);
      // Revert on error
      setVideos((prev) =>
        prev.map((video) => {
          if (video._id === videoId) {
            return {
              ...video,
              saves: currentSaves,
              savesCount: currentSaves,
              savedBy: savedByArray,
            };
          }
          return video;
        })
      );
    }
  };

  const handleShare = async (videoId: string) => {
    // Track share if needed - you can add API call here to increment share count
    // For now, just log it
    console.log(`Video ${videoId} shared`);
  };

  return {
    handleLike,
    handleComment,
    handleFollow,
    handleSave,
    handleShare,
  };
};

