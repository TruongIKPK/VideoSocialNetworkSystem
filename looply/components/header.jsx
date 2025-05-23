"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Header component with search and user menu
export default function Header() {
  const { user, logout } = useUser()
  const { language } = useLanguage()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const userMenuRef = useRef(null)
  const router = useRouter()

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div className="w-full max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder={language === "en" ? "Search videos..." : "Tìm kiếm video..."}
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <button 
            type="submit" 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${searchQuery.trim() ? 'text-red-500' : 'text-gray-400'}`}
          >
            <span className="text-sm font-medium">{language === "en" ? "Search" : "Tìm"}</span>
          </button>
        </form>
      </div>

      <div className="flex items-center">
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button onClick={toggleUserMenu} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={user.avatar || "/no_avatar.png"}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="object-cover"
                  priority
                />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {language === "en" ? "View profile" : "Xem hồ sơ"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {language === "en" ? "Log out" : "Đăng xuất"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-primary">
            {language === "en" ? "Log in" : "Đăng nhập"}
          </Link>
        )}
      </div>
    </header>
  )
}
