"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import Image from "next/image"
import LoginModal from "./login-modal"
import CommentSection from "./comment-section"
import { likeVideo, saveVideo, shareVideo } from "@/lib/api"
import { formatTimeAgo } from "@/lib/utils"; // Import for formatting time

// Thêm import cho hook useIsMobile
import { useIsMobile } from "@/hooks/use-mobile"

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
  const [savesCount, setSavesCount] = useState(video.saves || 0)
  const [sharesCount, setSharesCount] = useState(video.shares || 0)
  const videoRef = useRef(null)
  const isMobile = useIsMobile() // Sử dụng hook để xác định thiết bị mobile
  const [orientation, setOrientation] = useState('portrait') // Định hướng màn hình

  // Extract normalized user id from the video object
  const userId = video.user && (extractMongoId(video.user._id) || video.user.id || video.userId);

  // Theo dõi sự thay đổi về hướng màn hình (chỉ cho mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOrientation = () => {
        setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
      };
      
      // Khởi tạo giá trị ban đầu
      handleOrientation();
      
      // Theo dõi sự thay đổi
      window.addEventListener('resize', handleOrientation);
      
      return () => {
        window.removeEventListener('resize', handleOrientation);
      };
    }
  }, []);

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
    
    // Kiểm tra xem user hiện tại đã save video này chưa
    if (user && video.savedBy) {
      const currentUserId = extractMongoId(user._id) || user.id;
      
      // Kiểm tra trong savedBy array, xử lý cả ObjectId và string
      const isSaved = Array.isArray(video.savedBy) && video.savedBy.some(id => {
        const extractedId = extractMongoId(id);
        return extractedId === currentUserId;
      });
      
      setSaved(isSaved);
    } else {
      setSaved(false);
    }
    
    // Cập nhật số lượng likes từ video
    // Xử lý trường hợp likes là object với $numberInt
    let likes = video.likes;
    if (typeof video.likes === 'object' && video.likes.$numberInt) {
      likes = Number(video.likes.$numberInt);
    }
    setLikesCount(likes || 0);
    
    // Cập nhật số lượng saves từ video
    let saves = video.saves;
    if (typeof video.saves === 'object' && video.saves.$numberInt) {
      saves = Number(video.saves.$numberInt);
    }
    setSavesCount(saves || 0);

    // Cập nhật số lượng shares từ video
    let shares = video.shares;
    if (typeof video.shares === 'object' && video.shares.$numberInt) {
      shares = Number(video.shares.$numberInt);
    }
    setSharesCount(shares || 0);
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
  const handleSave = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    try {
      // Hiển thị thay đổi UI ngay lập tức (optimistic UI update)
      const newSavedState = !saved;
      setSaved(newSavedState);
      setSavesCount(prevCount => newSavedState ? prevCount + 1 : prevCount - 1);
      
      // Gọi API để cập nhật trạng thái save
      const videoId = extractMongoId(video._id) || video.id;
      const response = await saveVideo(videoId);
      
      // Cập nhật lại UI dựa trên phản hồi từ server
      setSaved(response.hasSaved);
      setSavesCount(response.saves);
      
      console.log('Video save updated:', response);
    } catch (error) {
      // Nếu có lỗi, khôi phục trạng thái UI ban đầu
      console.error("Failed to save video:", error);
      setSaved(!saved);
      setSavesCount(video.saves || 0);
      
      // Hiển thị thông báo lỗi
      alert(error.message || "Không thể cập nhật trạng thái lưu video");
    }
  }

  // Handle comment button click
  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setShowComments(!showComments)
  }

  // Handle share button click
  const handleShare = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    try {
      // Hiển thị thay đổi UI ngay lập tức (optimistic UI update)
      setSharesCount(prevCount => prevCount + 1);
      
      // Gọi API để cập nhật số lượt chia sẻ
      const videoId = extractMongoId(video._id) || video.id;
      const response = await shareVideo(videoId);
      
      // Cập nhật lại UI dựa trên phản hồi từ server
      setSharesCount(response.shares);
      
      // Mở cửa sổ chia sẻ của trình duyệt
      if (navigator.share) {
        await navigator.share({
          title: video.title || 'Video từ Looply',
          text: video.description || 'Hãy xem video này trên Looply!',
          url: window.location.href
        });
      } else {
        // Nếu API Web Share không được hỗ trợ, sử dụng phương thức thay thế
        const videoUrl = window.location.href;
        await navigator.clipboard.writeText(videoUrl);
        alert('Đã sao chép liên kết video vào clipboard!');
      }
      
      console.log('Video shared successfully:', response);
    } catch (error) {
      // Nếu có lỗi, khôi phục trạng thái UI ban đầu
      console.error("Failed to share video:", error);
      setSharesCount(video.shares || 0);
      
      // Hiển thị thông báo lỗi
      alert(error.message || "Không thể chia sẻ video");
    }
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
    <div className="border border-gray-200 rounded-lg overflow-hidden sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">      <div className="p-3 sm:p-4 flex items-center">
        <Link href={`/user/${userId}`} className="flex items-center flex-grow min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={video.user?.avatar || "/no_avatar.png"}
              alt={video.user?.name || "User"}
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          <div className="ml-2 sm:ml-3 truncate">
            <div className="font-semibold text-sm sm:text-base truncate">{video.user?.name || "User"}</div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">
              {video.title}
            </div>
          </div>
        </Link>

        <button className="ml-2 text-gray-500 flex-shrink-0">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className={`relative ${isMobile && orientation === 'landscape' ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}>
        <video
          ref={videoRef}
          src={video.url}
          className={`w-full ${
            isMobile 
              ? orientation === 'landscape' 
                ? 'h-[85vh] md:max-h-[80vh]' 
                : 'max-h-[60vh] sm:max-h-[70vh]'
              : 'max-h-[80vh]'
          } object-contain bg-black`}
          onClick={togglePlay}
          loop
          playsInline
          poster={video.thumbnail}
          controls={false}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
            <div className="bg-black bg-opacity-50 rounded-full p-3 sm:p-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}        {/* Điều chỉnh vị trí nút tương tác dựa trên thiết bị và hướng màn hình */}
        <div 
          className={`${
            isMobile 
              ? orientation === 'landscape'
                ? "absolute right-4 bottom-4 flex flex-col items-center space-y-3"
                : "absolute bottom-2 right-0 left-0 flex justify-evenly items-center px-2"
              : "absolute right-4 bottom-4 flex flex-col items-center space-y-4"
          }`}
        >
          <button
            onClick={handleLike}
            className={`bg-gray-800 bg-opacity-50 rounded-full ${
              isMobile && orientation === 'portrait' ? "p-1.5" : "p-2"
            } ${liked ? "text-red-500" : "text-white"}`}
          >
            <Heart 
              className={`${isMobile && orientation === 'portrait' ? "h-5 w-5" : "h-6 w-6"}`} 
              fill={liked ? "currentColor" : "none"} 
            />
            <span className={`text-xs mt-1 block ${isMobile && orientation === 'portrait' ? "text-[10px]" : ""}`}>
              {formatCount(likesCount)}
            </span>
          </button>

          <button 
            onClick={handleComment} 
            className={`bg-gray-800 bg-opacity-50 rounded-full ${
              isMobile && orientation === 'portrait' ? "p-1.5" : "p-2"
            } text-white`}
          >
            <MessageCircle 
              className={`${isMobile && orientation === 'portrait' ? "h-5 w-5" : "h-6 w-6"}`}
            />
            <span className={`text-xs mt-1 block ${isMobile && orientation === 'portrait' ? "text-[10px]" : ""}`}>
              {formatCount(
                typeof video.comments === 'object' && video.comments.$numberInt 
                  ? Number(video.comments.$numberInt) 
                  : video.comments || 0
              )}
            </span>
          </button>

          <button
            onClick={handleSave}
            className={`bg-gray-800 bg-opacity-50 rounded-full ${
              isMobile && orientation === 'portrait' ? "p-1.5" : "p-2"
            } ${saved ? "text-yellow-500" : "text-white"}`}
          >
            <Bookmark 
              className={`${isMobile && orientation === 'portrait' ? "h-5 w-5" : "h-6 w-6"}`}
              fill={saved ? "currentColor" : "none"} 
            />
            <span className={`text-xs mt-1 block ${isMobile && orientation === 'portrait' ? "text-[10px]" : ""}`}>
              {formatCount(savesCount)}
            </span>
          </button>

          <button 
            onClick={handleShare} 
            className={`bg-gray-800 bg-opacity-50 rounded-full ${
              isMobile && orientation === 'portrait' ? "p-1.5" : "p-2"
            } text-white`}
          >
            <Share2 
              className={`${isMobile && orientation === 'portrait' ? "h-5 w-5" : "h-6 w-6"}`}
            />
            <span className={`text-xs mt-1 block ${isMobile && orientation === 'portrait' ? "text-[10px]" : ""}`}>
              {formatCount(
                typeof video.shares === 'object' && video.shares.$numberInt 
                  ? Number(video.shares.$numberInt) 
                  : video.shares || 0
              )}
            </span>          </button>
        </div>
      </div>
      
      {/* Hiển thị thời gian đăng bên dưới video */}
      {video.createdAt && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
          {video.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              {video.description}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Đăng vào: {new Date(video.createdAt).toLocaleDateString()} • {formatTimeAgo(video.createdAt)}
          </p>
        </div>
      )}
      
      {showComments && (
        <div className={`${
          isMobile 
            ? orientation === 'landscape' 
              ? "max-h-[40vh] overflow-y-auto"
              : "max-h-[50vh] overflow-y-auto" 
            : "max-h-[400px] overflow-y-auto"
        }`}>
          <CommentSection videoId={extractMongoId(video._id) || video.id} />
        </div>
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}

