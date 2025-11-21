import { useState } from "react";

const API_BASE_URL = "https://videosocialnetworksystem.onrender.com/api";

interface UseSaveVideoOptions {
  token: string | null;
}

export const useSaveVideo = ({ token }: UseSaveVideoOptions) => {
  const [isSaving, setIsSaving] = useState(false);

  const saveVideo = async (videoId: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: "Bạn cần đăng nhập để lưu video" };
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/saves/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu video");
      }

      return { success: true, message: data.message || "Đã lưu video" };
    } catch (error: any) {
      console.error("Save video error:", error);
      return { success: false, message: error.message || "Đã xảy ra lỗi khi lưu video" };
    } finally {
      setIsSaving(false);
    }
  };

  const unsaveVideo = async (videoId: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: "Bạn cần đăng nhập để bỏ lưu video" };
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/saves/unsave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể bỏ lưu video");
      }

      return { success: true, message: data.message || "Đã bỏ lưu video" };
    } catch (error: any) {
      console.error("Unsave video error:", error);
      return { success: false, message: error.message || "Đã xảy ra lỗi khi bỏ lưu video" };
    } finally {
      setIsSaving(false);
    }
  };

  const checkSave = async (userId: string, videoId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/saves/check?userId=${userId}&videoId=${videoId}`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isSaved || data.saved || false;
    } catch (error) {
      console.error("Check save error:", error);
      return false;
    }
  };

  return {
    saveVideo,
    unsaveVideo,
    checkSave,
    isSaving,
  };
};

