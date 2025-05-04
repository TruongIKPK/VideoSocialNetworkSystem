"use client"

import { useState, useEffect } from "react"
import VideoCard from "@/components/video-card"
import { useLanguage } from "@/context/language-context"
import { fetchVideos, updateUserProfile } from "@/lib/api"

// Home page component
export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  // Normalize MongoDB data by handling $oid and $numberInt fields
  const normalizeMongoData = (data) => {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => normalizeMongoData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      // Deep copy to avoid mutation
      const result = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (key === '$oid') {
          // If this is an $oid object, return the string value directly
          return value;
        }
        
        if (key === '$numberInt' || key === '$numberLong' || key === '$numberDouble') {
          // Convert number values
          return Number(value);
        }
        
        // Process nested objects/arrays
        result[key] = normalizeMongoData(value);
      }
      
      return result;
    }
    
    return data;
  };

  // Fetch videos on component mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchVideos()
        
        // Normalize MongoDB special fields
        const normalizedData = normalizeMongoData(data);
        
        // Sort videos by createdAt in descending order (newest first)
        const sortedVideos = [...normalizedData].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setVideos(sortedVideos)
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
          <VideoCard 
            key={video._id || video.id} 
            video={{
              ...video,
              // Đảm bảo ID được truyền đúng cách
              _id: video._id || video.id,
              // Đảm bảo các thuộc tính người dùng được truyền đúng cách
              user: video.user ? {
                ...video.user,
                _id: video.user._id || video.user.id
              } : null
            }} 
          />
        ))}
      </div>
    </div>
  )
}
