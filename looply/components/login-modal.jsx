"use client"
import { X } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"
import { useState } from "react"
import { loginUser } from "@/lib/api"
import { useRouter } from "next/navigation"

// Login modal component
export default function LoginModal({ onClose }) {
  const { language } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = await loginUser(email, password)
      // Đăng nhập thành công
      onClose()
      router.push("/") // Chuyển hướng về trang chủ
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{language === "en" ? "Log in to Looply" : "Đăng nhập vào Looply"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {language === "en" ? "Email" : "Email"}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {language === "en" ? "Password" : "Mật khẩu"}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading
              ? language === "en"
                ? "Logging in..."
                : "Đang đăng nhập..."
              : language === "en"
              ? "Log in"
              : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {language === "en" ? "Don't have an account?" : "Chưa có tài khoản?"}{" "}
          <Link href="/register" className="text-red-500 hover:underline" onClick={onClose}>
            {language === "en" ? "Sign up" : "Đăng ký"}
          </Link>
        </div>
      </div>
    </div>
  )
}
