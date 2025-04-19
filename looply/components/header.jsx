"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { useUser } from "@/context/user-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import Image from "next/image"

// Header component with search and user menu
export default function Header() {
  const { user } = useUser()
  const { language } = useLanguage()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

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

  return (
    <header className="border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      <div className="w-full max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder={language === "en" ? "Search" : "Tìm kiếm"}
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button onClick={toggleUserMenu} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={user.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {language === "en" ? "View profile" : "Xem hồ sơ"}
                  </Link>

                  <Link href="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {language === "en" ? "Log out" : "Đăng xuất"}
                  </Link>
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
