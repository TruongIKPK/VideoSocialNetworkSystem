"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/language-context"
import { Send } from "lucide-react"

// Feedback page component
export default function FeedbackPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [feedback, setFeedback] = useState("")
  const [category, setCategory] = useState("general")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!feedback.trim()) return

    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitted(true)
    setLoading(false)

    // Reset form after 3 seconds and redirect
    setTimeout(() => {
      router.push("/")
    }, 3000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Feedback & Help" : "Phản hồi và trợ giúp"}</h1>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {language === "en" ? "Thank you for your feedback!" : "Cảm ơn phản hồi của bạn!"}
              </h2>
              <p className="text-gray-600">
                {language === "en"
                  ? "Your feedback has been submitted successfully."
                  : "Phản hồi của bạn đã được gửi thành công."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
                  {language === "en" ? "Category" : "Danh mục"}
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                >
                  <option value="general">{language === "en" ? "General Feedback" : "Phản hồi chung"}</option>
                  <option value="bug">{language === "en" ? "Report a Bug" : "Báo cáo lỗi"}</option>
                  <option value="feature">{language === "en" ? "Feature Request" : "Yêu cầu tính năng"}</option>
                  <option value="content">{language === "en" ? "Content Issue" : "Vấn đề về nội dung"}</option>
                  <option value="other">{language === "en" ? "Other" : "Khác"}</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="feedback" className="block text-gray-700 text-sm font-bold mb-2">
                  {language === "en" ? "Your Feedback" : "Phản hồi của bạn"}
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                  placeholder={
                    language === "en"
                      ? "Please describe your feedback or issue in detail..."
                      : "Vui lòng mô tả chi tiết phản hồi hoặc vấn đề của bạn..."
                  }
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {language === "en" ? "Cancel" : "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={loading || !feedback.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {language === "en" ? "Submitting..." : "Đang gửi..."}
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {language === "en" ? "Submit Feedback" : "Gửi phản hồi"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
