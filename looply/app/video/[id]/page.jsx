"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import VideoCard from "@/components/video-card"
import { fetchVideoById, fetchUserVideos } from "@/lib/api"
import { useLanguage } from "@/context/language-context"

export default function VideoPage() {
  const params = useParams()
  const { language } = useLanguage()
  const videoId = params.id
  const [mainVideo, setMainVideo] = useState(null)
  const [userVideos, setUserVideos] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch main video
        const video = await fetchVideoById(videoId)
        setMainVideo(video)
        
        if (video && video.user) {
          // Fetch all videos from this user
          const userId = video.user._id || video.user.id
          const allUserVideos = await fetchUserVideos(userId)
          
          // Sort videos by createdAt in descending order (newest first)
          const sortedVideos = [...allUserVideos].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
          
          setUserVideos(sortedVideos)
        }
      } catch (error) {
        console.error("Error fetching video data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (videoId) {
      fetchData()
    }
  }, [videoId])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }
  
  if (!mainVideo) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {language === "en" ? "Video not found" : "Không tìm thấy video"}
          </h2>
          <p className="mt-2 text-gray-600">
            {language === "en" 
              ? "The video you're looking for does not exist or has been removed." 
              : "Video bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."}
          </p>
        </div>
      </div>
    )
  }

  // Find current video index in the list of user videos
  const currentVideoIndex = userVideos.findIndex(
    v => (v._id || v.id) === videoId
  )

  // Reorder videos to show the current one first, then the rest in their original order
  const orderedVideos = [...userVideos]
  if (currentVideoIndex > -1) {
    // Remove the current video from its position
    const [currentVideo] = orderedVideos.splice(currentVideoIndex, 1)
    // Insert it at the beginning
    orderedVideos.unshift(currentVideo)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {language === "en" 
          ? `${mainVideo.user?.name || 'User'}'s Videos` 
          : `Video của ${mainVideo.user?.name || 'Người dùng'}`}
      </h1>

      <div className="space-y-8">
        {orderedVideos.map((video) => (
          <VideoCard key={video._id || video.id} video={video} />
        ))}
      </div>
      
      {userVideos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-500">
            {language === "en" 
              ? "No videos found for this user." 
              : "Không tìm thấy video nào của người dùng này."}
          </p>
        </div>
      )}
    </div>
  )
}
