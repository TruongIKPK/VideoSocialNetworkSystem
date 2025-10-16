"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VideoCard from "@/components/video-card"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { fetchVideos } from "@/lib/api"
import Link from "next/link"

// Following page component
export default function FollowingPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { language } = useLanguage()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  // Fetch videos on component mount
  useEffect(() => {
    if (user) {
      const loadVideos = async () => {
        try {
          const data = await fetchVideos()
          // Filter videos for following page (in a real app, this would be videos from followed users)
          // For demo, we'll just show a subset of videos
          const followingVideos = data.slice(0, 2)
          setVideos(followingVideos)
        } catch (error) {
          console.error("Failed to fetch videos:", error)
        } finally {
          setLoading(false)
        }
      }

      loadVideos()
    }
  }, [user])

  if (userLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Following" : "Theo dõi"}</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {language === "en"
              ? "Videos from people you follow will appear here"
              : "Video từ những người bạn theo dõi sẽ xuất hiện ở đây"}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === "en"
              ? "Follow accounts to see their latest videos"
              : "Theo dõi tài khoản để xem video mới nhất của họ"}
          </p>
          <Link href="/explore" className="btn-primary">
            {language === "en" ? "Find accounts to follow" : "Tìm tài khoản để theo dõi"}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
