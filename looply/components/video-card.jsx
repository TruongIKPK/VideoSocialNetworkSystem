"use client"

import { useState, useRef } from "react"
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import Image from "next/image"
import LoginModal from "./login-modal"
import CommentSection from "./comment-section"

// Video card component for displaying videos
export default function VideoCard({ video }) {
  const { user } = useUser()
  const { language } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const videoRef = useRef(null)

  // Toggle video play/pause
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
  const handleLike = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setLiked(!liked)
    // Here you would typically make an API call to update the like status
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
        <Link href={`/user/${video.user.id}`} className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={video.user.avatar || "/placeholder.svg?height=40&width=40"}
              alt={video.user.name}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div className="ml-3">
            <div className="font-semibold">{video.user.name}</div>
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
            <span className="text-xs mt-1 block">{formatCount(video.likes)}</span>
          </button>

          <button onClick={handleComment} className="bg-gray-800 bg-opacity-50 rounded-full p-2 text-white">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs mt-1 block">{formatCount(video.comments)}</span>
          </button>

          <button
            onClick={handleSave}
            className={`bg-gray-800 bg-opacity-50 rounded-full p-2 ${saved ? "text-yellow-500" : "text-white"}`}
          >
            <Bookmark className="h-6 w-6" fill={saved ? "currentColor" : "none"} />
            <span className="text-xs mt-1 block">{formatCount(video.saves)}</span>
          </button>

          <button className="bg-gray-800 bg-opacity-50 rounded-full p-2 text-white">
            <Share2 className="h-6 w-6" />
            <span className="text-xs mt-1 block">{formatCount(video.shares)}</span>
          </button>
        </div>
      </div>

      {showComments && <CommentSection videoId={video.id} />}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}
