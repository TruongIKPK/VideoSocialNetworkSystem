"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { Upload, X } from "lucide-react"
import { uploadVideo } from "@/lib/api"

// Upload page component
export default function UploadPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { language } = useLanguage()
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState("")
  const fileInputRef = useRef(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    // Check file type
    if (!selectedFile.type.includes("video/")) {
      setError(language === "en" ? "Please select a video file" : "Vui lòng chọn tệp video")
      return
    }

    // Check file size (500MB limit)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError(language === "en" ? "File size must be less than 500MB" : "Kích thước tệp phải nhỏ hơn 500MB")
      return
    }

    setFile(selectedFile)
    setError("")

    // Create video preview
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)

    // Clean up preview URL when component unmounts
    return () => URL.revokeObjectURL(url)
  }

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]

      // Check file type
      if (!droppedFile.type.includes("video/")) {
        setError(language === "en" ? "Please select a video file" : "Vui lòng chọn tệp video")
        return
      }

      // Check file size (500MB limit)
      if (droppedFile.size > 500 * 1024 * 1024) {
        setError(language === "en" ? "File size must be less than 500MB" : "Kích thước tệp phải nhỏ hơn 500MB")
        return
      }

      setFile(droppedFile)
      setError("")

      // Create video preview
      const url = URL.createObjectURL(droppedFile)
      setPreview(url)
    }
  }

  // Prevent default behavior for drag events
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError(language === "en" ? "Please select a video file" : "Vui lòng chọn tệp video")
      return
    }

    if (!title) {
      setError(language === "en" ? "Please enter a title" : "Vui lòng nhập tiêu đề")
      return
    }

    setUploading(true)
    setError("")

    try {
      await uploadVideo(file, title, description, (progress) => {
        setUploadProgress(progress)
      })

      // Redirect to profile page after successful upload
      setTimeout(() => {
        router.push("/profile")
      }, 1000)
    } catch (error) {
      setError(
        language === "en" ? "Failed to upload video. Please try again." : "Tải lên video thất bại. Vui lòng thử lại.",
      )
      setUploading(false)
    }
  }

  // Reset file selection
  const handleReset = () => {
    setFile(null)
    setPreview("")
    setTitle("")
    setDescription("")
    setUploadProgress(0)
    setError("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (userLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Upload Video" : "Tải lên video"}</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!file ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  className="hidden"
                />

                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    {language === "en" ? "Select video to upload" : "Chọn video để tải lên"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {language === "en" ? "Or drag and drop a file" : "Hoặc kéo và thả tệp vào đây"}
                  </p>
                  <p className="text-xs text-gray-500">{language === "en" ? "MP4 or WebM" : "MP4 hoặc WebM"}</p>
                  <p className="text-xs text-gray-500">{language === "en" ? "Up to 500MB" : "Tối đa 500MB"}</p>
                  <p className="text-xs text-gray-500">{language === "en" ? "Up to 60 minutes" : "Tối đa 60 phút"}</p>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-black mb-4">
                  {preview && <video src={preview} className="w-full h-full object-contain" controls />}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                    {language === "en" ? "Title" : "Tiêu đề"}
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                    placeholder={language === "en" ? "Add a title" : "Thêm tiêu đề"}
                    maxLength={100}
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                    {language === "en" ? "Description" : "Mô tả"}
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                    placeholder={language === "en" ? "Add a description" : "Thêm mô tả"}
                    rows={4}
                    maxLength={2000}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>

              {file && (
                <button
                  type="submit"
                  disabled={uploading || !title}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                  {uploading ? (
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
                      {language === "en" ? "Uploading..." : "Đang tải lên..."}
                    </span>
                  ) : language === "en" ? (
                    "Upload"
                  ) : (
                    "Tải lên"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-lg mb-2">{language === "en" ? "File requirements" : "Yêu cầu về tệp"}</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• {language === "en" ? "File format: MP4" : "Định dạng tệp: MP4"}</li>
            <li>• {language === "en" ? "Maximum file size: 500MB" : "Dung lượng tối đa: 500MB"}</li>
            <li>• {language === "en" ? "Maximum duration: 1 minute" : "Thời lượng video: 1 phút"}</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-bold text-lg mb-2">{language === "en" ? "Video resolution" : "Độ phân giải video"}</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• {language === "en" ? "Recommended: 1080p, 1440p" : "Đề xuất: 1080p, 1440p"}</li>
            <li>
              •{" "}
              {language === "en"
                ? "Aspect ratio: 16:9 for landscape, 9:16 for portrait"
                : "Tỷ lệ khung hình: 16:9 cho chế độ ngang, 9:16 cho chế độ dọc"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
