"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { Send, CornerDownRight, MessageSquareReply, Heart, MoreVertical } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { fetchComments, addComment } from "@/lib/api"

// Format time since post (e.g., "2 giờ trước")
function formatTimeSince(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return `${interval} năm trước`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return `${interval} tháng trước`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return `${interval} ngày trước`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return `${interval} giờ trước`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return `${interval} phút trước`;
  }
  
  return 'Vừa xong';
}

// Comment component
function Comment({ comment, videoId, onReplyAdded }) {
  const { user } = useUser()
  const { language } = useLanguage()
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [showReplies, setShowReplies] = useState(false)

  // Handle reply submission
  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    try {
      // Add reply by calling the API with parentId
      const newReply = await addComment(videoId, replyText, comment._id)
      setReplyText("")
      setReplying(false)
      
      // Notify parent component that a reply was added
      if (onReplyAdded) {
        onReplyAdded(newReply, comment._id)
      }
    } catch (error) {
      console.error("Failed to add reply:", error)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex">
        <Link href={`/user/${comment.user?._id}`} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
            <Image
              src={comment.user?.avatar || "/no_avatar.png"}
              alt={comment.user?.name || "User"}
              width={32}
              height={32}
              className="object-cover"
              priority
            />
          </div>
        </Link>
        <div className="flex-grow">
          <div className="bg-gray-50 px-3 py-2 rounded-lg">
            <div className="flex items-center">
              <Link href={`/user/${comment.user?._id}`}>
                <span className="font-semibold hover:underline">
                  {comment.user?.name || "User"}
                </span>
              </Link>
              <span className="ml-2 text-xs text-gray-500">
                {formatTimeSince(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.text}</p>
          </div>

          <div className="flex items-center mt-1 text-xs text-gray-600 space-x-3">
            <button className="hover:text-gray-900">
              <Heart className="inline h-3 w-3 mr-1" /> Thích
            </button>
            <button 
              onClick={() => setReplying(!replying)} 
              className="hover:text-gray-900"
            >
              <MessageSquareReply className="inline h-3 w-3 mr-1" /> 
              {language === "en" ? "Reply" : "Trả lời"}
            </button>
          </div>

          {/* Reply form */}
          {replying && user && (
            <form onSubmit={handleSubmitReply} className="flex mt-2 pl-4">
              <div className="w-7 h-7 rounded-full overflow-hidden mr-2">
                <Image
                  src={user.avatar || "/no_avatar.png"}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="object-cover"
                  priority
                />
              </div>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${language === "en" ? "Reply to" : "Trả lời"} ${comment.user?.name}...`}
                className="flex-1 border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                className="ml-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                disabled={!replyText.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Replies section */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 pl-4">
              {!showReplies && (
                <button 
                  onClick={() => setShowReplies(true)}
                  className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                >
                  <CornerDownRight className="h-3 w-3 mr-1" />
                  {language === "en" 
                    ? `View ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}` 
                    : `Xem ${comment.replies.length} trả lời`}
                </button>
              )}

              {showReplies && (
                <>
                  <button 
                    onClick={() => setShowReplies(false)}
                    className="text-sm flex items-center mb-2 text-gray-600 hover:text-gray-900"
                  >
                    <CornerDownRight className="h-3 w-3 mr-1" />
                    {language === "en" ? "Hide replies" : "Ẩn trả lời"}
                  </button>
                  <div className="space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex">
                        <Link href={`/user/${reply.user?._id}`} className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                            <Image
                              src={reply.user?.avatar || "/no_avatar.png"}
                              alt={reply.user?.name || "User"}
                              width={24}
                              height={24}
                              className="object-cover"
                              priority
                            />
                          </div>
                        </Link>
                        <div className="flex-grow">
                          <div className="bg-gray-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center">
                              <Link href={`/user/${reply.user?._id}`}>
                                <span className="font-semibold text-sm hover:underline">
                                  {reply.user?.name || "User"}
                                </span>
                              </Link>
                              <span className="ml-2 text-xs text-gray-500">
                                {formatTimeSince(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{reply.text}</p>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-600 space-x-3">
                            <button className="hover:text-gray-900">
                              <Heart className="inline h-3 w-3 mr-1" /> Thích
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

  // Handle when a reply is added to refresh comments
  const handleReplyAdded = async (newReply, parentCommentId) => {
    // Find the parent comment and add the reply to its replies array
    const updatedComments = comments.map(comment => {
      if (comment._id === parentCommentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        }
      }
      return comment
    })
    
    setComments(updatedComments)
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <h3 className="font-semibold mb-4">{language === "en" ? "Comments" : "Bình luận"}</h3>

      {user && (
        <form onSubmit={handleSubmit} className="flex mb-6">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
            <Image
              src={user.avatar || "/no_avatar.png"}
              alt={user.name}
              width={32}
              height={32}
              className="object-cover"
              priority
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
            <Comment 
              key={comment._id} 
              comment={comment} 
              videoId={videoId}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
