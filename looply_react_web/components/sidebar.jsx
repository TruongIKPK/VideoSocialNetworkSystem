"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Users, User, Upload, MoreHorizontal } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"
import { useUser } from "@/context/user-context"
import Image from "next/image"

// Sidebar component for navigation
export default function Sidebar() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout } = useUser()

  // Translation object for sidebar items
  const translations = {
    en: {
      recommend: "Recommended",
      explore: "Explore",
      following: "Following",
      profile: "Profile",
      upload: "Upload",
      more: "More",
      language: "Language",
      darkMode: "Dark mode",
      lightMode: "Light mode",
      feedback: "Feedback & Help",
      logout: "Logout",
      login: "Log in",
    },
    vi: {
      recommend: "Đề xuất",
      explore: "Khám phá",
      following: "Theo dõi",
      profile: "Hồ sơ",
      upload: "Tải lên",
      more: "Thêm",
      language: "Ngôn ngữ",
      darkMode: "Chế độ tối",
      lightMode: "Chế độ sáng",
      feedback: "Phản hồi và trợ giúp",
      logout: "Đăng xuất",
      login: "Log in",
    },
  }

  const t = translations[language]

  // Toggle more menu
  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  // Check if a link is active
  const isActive = (path) => {
    return pathname === path
  }

  return (
    <div className="w-64 border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <Link href="/" className="flex items-center mb-8">
          <div className="relative w-12 h-12">
            <Image
              src="/logo.png"
              alt="Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <span className="ml-2 text-xl font-bold">LOOPLY</span>
        </Link>

        <nav className="space-y-6">
          <Link
            href="/"
            className={`flex items-center space-x-3 ${isActive("/") ? "text-red-500 font-bold" : "text-gray-700 hover:text-red-500"}`}
          >
            <Home className="sidebar-icon" />
            <span>{t.recommend}</span>
          </Link>

          <Link
            href="/explore"
            className={`flex items-center space-x-3 ${isActive("/explore") ? "text-red-500 font-bold" : "text-gray-700 hover:text-red-500"}`}
          >
            <Compass className="sidebar-icon" />
            <span>{t.explore}</span>
          </Link>

          <Link
            href="/following"
            className={`flex items-center space-x-3 ${isActive("/following") ? "text-red-500 font-bold" : "text-gray-700 hover:text-red-500"}`}
          >
            <Users className="sidebar-icon" />
            <span>{t.following}</span>
          </Link>

          <Link
            href="/profile"
            className={`flex items-center space-x-3 ${isActive("/profile") ? "text-red-500 font-bold" : "text-gray-700 hover:text-red-500"}`}
          >
            <User className="sidebar-icon" />
            <span>{t.profile}</span>
          </Link>

          <Link
            href="/upload"
            className={`flex items-center space-x-3 ${isActive("/upload") ? "text-red-500 font-bold" : "text-gray-700 hover:text-red-500"}`}
          >
            <Upload className="sidebar-icon" />
            <span>{t.upload}</span>
          </Link>

          <div className="relative">
            <button
              onClick={toggleMoreMenu}
              className="flex items-center space-x-3 text-gray-700 hover:text-red-500 w-full"
            >
              <MoreHorizontal className="sidebar-icon" />
              <span>{t.more}</span>
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      const newLang = language === "en" ? "vi" : "en"
                      localStorage.setItem("language", newLang)
                      window.location.reload()
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {t.language}
                  </button>

                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {theme === "dark" ? t.lightMode : t.darkMode}
                  </button>

                  <Link href="/feedback" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t.feedback}
                  </Link>

                  {user ? (
                    <button
                      onClick={logout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      {t.logout}
                    </button>
                  ) : (
                    <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {t.login}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {!user && (
        <div className="px-4 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            {language === "en"
              ? "Log in to like, comment, and save videos."
              : "Đăng nhập để thích, bình luận và lưu video."}
          </p>
          <Link href="/login" className="btn-primary block text-center">
            {language === "en" ? "Log in" : "Đăng nhập"}
          </Link>
        </div>
      )}

      <div className="px-4 py-4 text-xs text-gray-500 border-t border-gray-200">
        <div className="mb-2">Terms & Policies</div>
        <div>{new Date().getFullYear()} Looply</div>
      </div>
    </div>
  )
}
