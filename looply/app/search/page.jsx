"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import VideoCard from "@/components/video-card"
import { useLanguage } from "@/context/language-context"
import { fetchVideos } from "@/lib/api"
import { Search, X, Filter } from "lucide-react"
import Link from "next/link"

// Loading component for Suspense
function SearchPageLoading() {
  return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
    </div>
  );
}

// Search page content component
function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ""
  
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState("date") // date, popularity
  const [showFilters, setShowFilters] = useState(false)
  const { language } = useLanguage()

  // Fetch videos on component mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchVideos()
        setVideos(data)
        
        // Thực hiện tìm kiếm ngay nếu có query từ URL
        if (initialQuery) {
          performSearch(data, initialQuery)
        } else {
          setFilteredVideos(data)
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [initialQuery])

  // Function to handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    performSearch(videos, query)
  }
  
  // Perform search based on query and apply sorting
  const performSearch = (videosData, query) => {
    if (!query.trim()) {
      // If search query is empty, show all videos with current sorting
      applySorting(videosData)
      return
    }
    
    // Filter videos by title or description containing the search query
    const filtered = videosData.filter(video => {
      const titleMatch = video.title && video.title.toLowerCase().includes(query)
      const descriptionMatch = video.description && video.description.toLowerCase().includes(query)
      const userMatch = video.user && video.user.name && video.user.name.toLowerCase().includes(query)
      return titleMatch || descriptionMatch || userMatch
    })
    
    // Apply sorting to filtered results
    applySorting(filtered)
  }
  
  // Apply sorting to video results
  const applySorting = (videosToSort) => {
    let sorted = [...videosToSort]
    
    if (sortBy === "date") {
      // Sort by date (newest first)
      sorted = sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } 
    else if (sortBy === "likes") {
      // Sort by likes (most likes first)
      sorted = sorted.sort((a, b) => {
        const likesA = typeof a.likes === 'number' ? a.likes : 0
        const likesB = typeof b.likes === 'number' ? b.likes : 0
        return likesB - likesA
      })
    }
    else if (sortBy === "saves") {
      // Sort by saves (most saves first)
      sorted = sorted.sort((a, b) => {
        const savesA = typeof a.saves === 'number' ? a.saves : 0
        const savesB = typeof b.saves === 'number' ? b.saves : 0
        return savesB - savesA
      })
    }
    
    setFilteredVideos(sorted)
  }
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    applySorting(filteredVideos)
  }
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    applySorting(videos)
  }

  if (loading) {
    return <SearchPageLoading />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Search Videos" : "Tìm kiếm Video"}</h1>

      {/* Thanh tìm kiếm */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder={language === "en" ? "Search videos by title, description or creator..." : "Tìm theo tên, mô tả hoặc người tạo..."}
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchQuery && (
          <button 
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Nút hiển thị bộ lọc */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-4 w-4" />
          <span>{language === "en" ? "Filters" : "Bộ lọc"}</span>
        </button>
        
        {/* Hiển thị số kết quả tìm kiếm */}
        {searchQuery && (
          <div className="text-sm text-gray-600">
            {language === "en" 
              ? `${filteredVideos.length} results` 
              : `${filteredVideos.length} kết quả`}
          </div>
        )}
      </div>
      
      {/* Bộ lọc mở rộng */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-medium mb-2">{language === "en" ? "Sort by" : "Sắp xếp theo"}</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleSortChange("date")}
              className={`px-3 py-1 rounded-full text-sm ${
                sortBy === "date" 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {language === "en" ? "Newest first" : "Mới nhất"}
            </button>
            <button 
              onClick={() => handleSortChange("likes")}
              className={`px-3 py-1 rounded-full text-sm ${
                sortBy === "likes" 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {language === "en" ? "Most likes" : "Nhiều lượt thích"}
            </button>
            <button 
              onClick={() => handleSortChange("saves")}
              className={`px-3 py-1 rounded-full text-sm ${
                sortBy === "saves" 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {language === "en" ? "Most saves" : "Nhiều lượt lưu"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <VideoCard key={video._id || video.id} video={video} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-500 mb-4">
              {language === "en" 
                ? "No videos found matching your search." 
                : "Không tìm thấy video phù hợp với tìm kiếm của bạn."}
            </p>
            {searchQuery && (
              <Link 
                href="/explore" 
                className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {language === "en" ? "Explore all videos" : "Khám phá tất cả video"}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Main Search page component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  )
}