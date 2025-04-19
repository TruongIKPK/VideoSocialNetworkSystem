"use client"

import { useState, useEffect } from "react"
import VideoCard from "@/components/video-card"
import { useLanguage } from "@/context/language-context"
import { fetchVideos } from "@/lib/api"

// Home page component
export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  // Fetch videos on component mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchVideos()
        setVideos(data)
      } catch (error) {
        console.error("Failed to fetch videos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Recommended for you" : "Đề xuất cho bạn"}</h1>

      <div className="space-y-8">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
