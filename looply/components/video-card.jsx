"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import Image from "next/image"
import LoginModal from "./login-modal"
import CommentSection from "./comment-section"
import { likeVideo } from "@/lib/api"

// Helper function to extract ID from MongoDB structure
function extractMongoId(id) {
  if (!id) return null;
  
  if (typeof id === 'object' && id.$oid) {
    return id.$oid;
  }
  
  if (typeof id === 'string' && id.includes('$oid')) {
    try {
      const parsed = JSON.parse(id);
      return parsed.$oid || id;
    } catch (e) {
      // If not valid JSON, return as is
      return id;
    }
  }
  
  return id;
}

// Video card component for displaying videos
export default function VideoCard({ video }) {
  const { user } = useUser()
  const { language } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(video.likes || 0)
  const videoRef = useRef(null)

  // Extract normalized user id from the video object
  const userId = video.user && (extractMongoId(video.user._id) || video.user.id || video.userId);

  // Initialize liked state when component mounts or video/user changes
  useEffect(() => {
    if (user && video.likedBy) {
      // Kiểm tra xem user hiện tại đã like video này chưa
      const currentUserId = extractMongoId(user._id) || user.id;
      
      // Kiểm tra trong likedBy array, xử lý cả ObjectId và string
      const isLiked = Array.isArray(video.likedBy) && video.likedBy.some(id => {
        const extractedId = extractMongoId(id);
        return extractedId === currentUserId;
      });
      
      setLiked(isLiked);
    } else {
      setLiked(false);
    }
    
    // Cập nhật số lượng likes từ video
    // Xử lý trường hợp likes là object với $numberInt
    let likes = video.likes;
    if (typeof video.likes === 'object' && video.likes.$numberInt) {
      likes = Number(video.likes.$numberInt);
    }
    
    setLikesCount(likes || 0);
  }, [user, video]);

  // Intersection Observer logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play()
              setIsPlaying(true)
            } else {
              videoRef.current.pause()
              setIsPlaying(false)
            }
          }
        })
      },
      { threshold: 0.5 } // Ít nhất 50% video trong viewport mới phát
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current)
      }
    }
  }, [])

  // Toggle video play/pause manually
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle like button click
  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    
    try {
      // Hiển thị thay đổi UI ngay lập tức (optimistic UI update)
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikesCount(prevCount => newLikedState ? prevCount + 1 : prevCount - 1);
      
      // Gọi API để cập nhật trạng thái like
      const videoId = extractMongoId(video._id) || video.id;
      const response = await likeVideo(videoId);
      
      // Cập nhật lại UI dựa trên phản hồi từ server
      setLiked(response.hasLiked);
      setLikesCount(response.likes);
      
      console.log('Video like updated:', response);
    } catch (error) {
      // Nếu có lỗi, khôi phục trạng thái UI ban đầu
      console.error("Failed to like video:", error);
      setLiked(!liked);
      setLikesCount(video.likes || 0);
      
      // Hiển thị thông báo lỗi
      alert(error.message || "Không thể cập nhật trạng thái like video");
    }
  }

  // Handle save button click
  const handleSave = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setSaved(!saved)
    // Here you would typically make an API call to update the save status
  }

  // Handle comment button click
  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setShowComments(!showComments)
  }

  // Format view count
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M"
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K"
    }
    return count.toString()
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 flex items-center">
        <Link href={`/user/${userId}`} className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={video.user?.avatar || "/no_avatar.png"}
              alt={video.user?.name || "User"}
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          <div className="ml-3">
            <div className="font-semibold">{video.user?.name || "User"}</div>
            <div className="text-sm text-gray-500">{video.title}</div>
          </div>
        </Link>

        <button className="ml-auto text-gray-500">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full max-h-[80vh] object-contain bg-black"
          onClick={togglePlay}
          loop
          playsInline
          poster={video.thumbnail}
          controls={false}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute right-4 bottom-4 flex flex-col items-center space-y-4">
          <button
            onClick={handleLike}
            className={`bg-gray-800 bg-opacity-50 rounded-full p-2 ${liked ? "text-red-500" : "text-white"}`}
          >
            <Heart className="h-6 w-6" fill={liked ? "currentColor" : "none"} />
            <span className="text-xs mt-1 block">{formatCount(likesCount)}</span>
          </button>

          <button onClick={handleComment} className="bg-gray-800 bg-opacity-50 rounded-full p-2 text-white">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs mt-1 block">{formatCount(
              typeof video.comments === 'object' && video.comments.$numberInt 
                ? Number(video.comments.$numberInt) 
                : video.comments || 0
            )}</span>
          </button>

          <button
            onClick={handleSave}
            className={`bg-gray-800 bg-opacity-50 rounded-full p-2 ${saved ? "text-yellow-500" : "text-white"}`}
          >
            <Bookmark className="h-6 w-6" fill={saved ? "currentColor" : "none"} />
            <span className="text-xs mt-1 block">{formatCount(
              typeof video.saves === 'object' && video.saves.$numberInt 
                ? Number(video.saves.$numberInt) 
                : video.saves || 0
            )}</span>
          </button>

          <button className="bg-gray-800 bg-opacity-50 rounded-full p-2 text-white">
            <Share2 className="h-6 w-6" />
            <span className="text-xs mt-1 block">{formatCount(
              typeof video.shares === 'object' && video.shares.$numberInt 
                ? Number(video.shares.$numberInt) 
                : video.shares || 0
            )}</span>
          </button>
        </div>
      </div>

      {showComments && <CommentSection videoId={extractMongoId(video._id) || video.id} />}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}

