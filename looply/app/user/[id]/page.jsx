"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { UserPlus, CheckCheck, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { fetchUserVideos, getUserProfile, followUser } from "@/lib/api"
import LoginModal from "@/components/login-modal"

// User profile page component
export default function UserProfile() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: userLoading } = useUser()
  const { language } = useLanguage()
  const userId = params?.id

  const [profileUser, setProfileUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [activeTab, setActiveTab] = useState("videos")
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Kiểm tra nếu đang xem profile của chính mình
  const isSelfProfile = user && userId && (user._id === userId || user.id === userId)

  // Redirect to profile if viewing own profile
  useEffect(() => {
    if (isSelfProfile) {
      router.push("/profile")
    }
  }, [isSelfProfile, router])

  // Fetch user profile and videos
  useEffect(() => {
    if (userId) {
      const loadData = async () => {
        setLoading(true)
        try {
          // Load profile data and videos in parallel
          const [profileData, videosData] = await Promise.all([
            getUserProfile(userId),
            fetchUserVideos(userId)
          ])
          
          setProfileUser(profileData)
          setIsFollowing(profileData.isFollowingUser || false)
          setFollowersCount(profileData.followers || 0)
          setFollowingCount(profileData.following || 0)
          
          // Sort videos by creation date (newest first)
          const sortedVideos = [...videosData].sort((a, b) => 
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          )
          
          setVideos(sortedVideos)
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, [userId])

  // Handle follow button click
  const handleFollow = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    
    try {
      setFollowLoading(true)
      
      // Cập nhật UI ngay lập tức (optimistic update)
      setIsFollowing(!isFollowing)
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      
      const result = await followUser(userId)
      
      // Cập nhật state từ phản hồi của server
      setIsFollowing(result.isFollowing)
      setFollowersCount(result.followersCount)
      
    } catch (error) {
      console.error("Failed to follow user:", error)
      // Khôi phục trạng thái nếu có lỗi
      setIsFollowing(isFollowing)
      setFollowersCount(followersCount)
      alert(language === "en" ? "Failed to follow user" : "Không thể theo dõi người dùng")
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          {language === "en" ? "User not found" : "Không tìm thấy người dùng"}
        </h1>
        <p className="mt-4 text-gray-500">
          {language === "en" 
            ? "The user you are looking for does not exist or has been deleted." 
            : "Người dùng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."}
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {language === "en" ? "Go to home page" : "Về trang chủ"}
          </Link>
        </div>
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
                src={profileUser.avatar || "/no_avatar.png"}
                alt={profileUser.name}
                width={128}
                height={128}
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <p className="text-gray-600">@{profileUser.username}</p>

              <div className="mt-4 flex flex-wrap justify-center md:justify-start space-x-6">
                <div>
                  <span className="font-bold">{followingCount}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Following" : "Đã follow"}</span>
                </div>
                <div>
                  <span className="font-bold">{followersCount}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Followers" : "Follower"}</span>
                </div>
                <div>
                  <span className="font-bold">{profileUser.likes || 0}</span>{" "}
                  <span className="text-gray-600">{language === "en" ? "Likes" : "Lượt thích"}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    isFollowing
                      ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      : "border-transparent text-white bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      {language === "en" ? "Following" : "Đang theo dõi"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {language === "en" ? "Follow" : "Theo dõi"}
                    </>
                  )}
                </button>

                <button
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === "en" ? "Share" : "Chia sẻ"}
                </button>
              </div>
            </div>
          </div>

          {profileUser.bio && (
            <div className="mt-6">
              <p className="text-gray-700">{profileUser.bio}</p>
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
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === "en" ? "No videos uploaded yet" : "Chưa có video nào được tải lên"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
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
      
      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}