"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { Pencil, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { fetchUserVideos, fetchLikedVideos } from "@/lib/api"

// Profile page component
export default function Profile() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState("videos")
  const [videos, setVideos] = useState([])
  const [likedVideos, setLikedVideos] = useState([])
  const [savedVideos, setSavedVideos] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  // Fetch user videos and liked videos on component mount
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          // Lấy ID người dùng, hỗ trợ cả hai cấu trúc dữ liệu (_id hoặc id)
          const userId = user._id || user.id;
          
          // Tải song song dữ liệu video của user và video đã thích
          const [userVideosData, likedVideosData] = await Promise.all([
            fetchUserVideos(userId),
            fetchLikedVideos(userId)
          ]);
          
          // Sắp xếp video theo thời gian tạo (mới nhất trước)
          const sortVideos = (videos) => {
            return [...videos].sort((a, b) => 
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
          };
          
          setVideos(sortVideos(userVideosData));
          setLikedVideos(sortVideos(likedVideosData));
          
          // Video đã lưu - tạm thời để trống, sẽ cập nhật sau khi có API
          setSavedVideos([]);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [user]);
  
  // Hiển thị video theo tab được chọn
  const getActiveVideos = () => {
    switch (activeTab) {
      case "videos": 
        return videos;
      case "liked": 
        return likedVideos;
      case "saved": 
        return savedVideos;
      default: 
        return [];
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden">
              <Image
                src={user.avatar || "/no_avatar.png"}
                alt={user.name}
                width={128}
                height={128}
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">@{user.username}</p>

              <div className="mt-4 flex flex-wrap justify-center md:justify-start space-x-6">
                <div>
                  <span className="font-bold">{user.following || 0}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Following" : "Đã follow"}</span>
                </div>
                <div>
                  <span className="font-bold">{user.followers || 0}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Followers" : "Follower"}</span>
                </div>
                <div>
                  <span className="font-bold">{user.likes || 0}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Likes" : "Lượt thích"}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {language === "en" ? "Edit profile" : "Sửa hồ sơ"}
                </Link>

                <Link
                  href="/settings"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {language === "en" ? "Settings" : "Cài đặt"}
                </Link>
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mt-6">
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "videos" ? "text-red-500 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {language === "en" ? "Videos" : "Video"}
            </button>

            <button
              onClick={() => setActiveTab("liked")}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "liked" ? "text-red-500 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {language === "en" ? "Liked" : "Đã thích"}
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "saved" ? "text-red-500 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {language === "en" ? "Saved" : "Đã lưu"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : getActiveVideos().length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === "videos" &&
                (language === "en" ? "No videos uploaded yet" : "Chưa có video nào được tải lên")}
              {activeTab === "liked" && (language === "en" ? "No liked videos yet" : "Chưa có video nào được thích")}
              {activeTab === "saved" && (language === "en" ? "No saved videos yet" : "Chưa có video nào được lưu")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getActiveVideos().map((video) => (
              <div key={video._id || video.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative aspect-w-16 aspect-h-9">
                  <Link href={`/video/${video._id || video.id}`}>
                    <video
                      src={video.url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-end p-4">
                      <div className="text-white">
                        <h3 className="font-medium text-lg truncate">{video.title}</h3>
                        <p className="text-sm opacity-90 truncate">{video.description}</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {video.views?.toLocaleString() || 0} {language === "en" ? "views" : "lượt xem"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {video.likes?.toLocaleString() || 0} {language === "en" ? "likes" : "thích"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {video.comments?.toLocaleString() || 0} {language === "en" ? "comments" : "bình luận"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
