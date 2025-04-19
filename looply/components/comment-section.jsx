"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { Send } from "lucide-react"
import Image from "next/image"
import { fetchComments, addComment } from "@/lib/api"

// Comment section component
export default function CommentSection({ videoId }) {
  const { user } = useUser()
  const { language } = useLanguage()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)

  // Fetch comments on component mount
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await fetchComments(videoId)
        setComments(data)
      } catch (error) {
        console.error("Failed to fetch comments:", error)
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [videoId])

  // Handle comment submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) return

    try {
      const comment = await addComment(videoId, newComment)
      setComments([comment, ...comments])
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <h3 className="font-semibold mb-4">{language === "en" ? "Comments" : "Bình luận"}</h3>

      {user && (
        <form onSubmit={handleSubmit} className="flex mb-6">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
            <Image
              src={user.avatar || "/placeholder.svg?height=32&width=32"}
              alt={user.name}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={language === "en" ? "Add a comment..." : "Thêm bình luận..."}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="ml-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={!newComment.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          {language === "en" ? "No comments yet" : "Chưa có bình luận nào"}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                <Image
                  src={comment.user.avatar || "/placeholder.svg?height=32&width=32"}
                  alt={comment.user.name}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-semibold">{comment.user.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{comment.timestamp}</span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
