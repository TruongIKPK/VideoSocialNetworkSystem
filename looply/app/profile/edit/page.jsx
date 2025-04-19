"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import { Pencil } from "lucide-react"
import Image from "next/image"
import { updateUserProfile } from "@/lib/api"

// Profile edit page component
export default function EditProfile() {
  const router = useRouter()
  const { user, loading: userLoading, updateProfile } = useUser()
  const { language } = useLanguage()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  // Set initial form values
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setBio(user.bio || "")
    }
  }, [user])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name) {
      setError(language === "en" ? "Name is required" : "Tên là bắt buộc")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const updatedData = await updateUserProfile(user.id, { name, bio })
      updateProfile(updatedData)
      setSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (error) {
      setError(
        language === "en"
          ? "Failed to update profile. Please try again."
          : "Cập nhật hồ sơ thất bại. Vui lòng thử lại.",
      )
    } finally {
      setLoading(false)
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">{language === "en" ? "Edit Profile" : "Sửa hồ sơ"}</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {language === "en" ? "Profile updated successfully!" : "Cập nhật hồ sơ thành công!"}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {language === "en" ? "Profile Picture" : "Ảnh hồ sơ"}
              </label>
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <Image
                    src={user.avatar || "/placeholder.svg?height=96&width=96"}
                    alt={user.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {language === "en" ? "Change" : "Thay đổi"}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                {language === "en" ? "Name" : "Tên"}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                placeholder={language === "en" ? "Your name" : "Tên của bạn"}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="bio" className="block text-gray-700 text-sm font-bold mb-2">
                {language === "en" ? "Bio" : "Tiểu sử"}
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-red-500"
                placeholder={language === "en" ? "Tell us about yourself" : "Giới thiệu về bản thân"}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {language === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
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
                    {language === "en" ? "Saving..." : "Đang lưu..."}
                  </span>
                ) : language === "en" ? (
                  "Save"
                ) : (
                  "Lưu"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
