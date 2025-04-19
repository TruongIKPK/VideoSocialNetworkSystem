"use client"
import { X } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"

// Login modal component
export default function LoginModal({ onClose }) {
  const { language } = useLanguage()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{language === "en" ? "Log in to Looply" : "Đăng nhập vào Looply"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-6 text-gray-600">
          {language === "en"
            ? "You need to log in to perform this action."
            : "Bạn cần đăng nhập để thực hiện hành động này."}
        </p>

        <Link href="/login" className="btn-primary block text-center mb-4" onClick={onClose}>
          {language === "en" ? "Log in" : "Đăng nhập"}
        </Link>

        <div className="text-center text-sm text-gray-600">
          {language === "en" ? "Don't have an account?" : "Chưa có tài khoản?"}{" "}
          <Link href="/register" className="text-red-500 hover:underline" onClick={onClose}>
            {language === "en" ? "Sign up" : "Đăng ký"}
          </Link>
        </div>
      </div>
    </div>
  )
}
