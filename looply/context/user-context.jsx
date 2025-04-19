"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Create context for user data
const UserContext = createContext()

// Custom hook to use the user context
export function useUser() {
  return useContext(UserContext)
}

// Provider component for user data
export function UserProvider({ children }) {
  // State for user data
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error("Failed to load user data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = (userData) => {
    // Save user data to localStorage
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  // Logout function
  const logout = () => {
    // Remove user data from localStorage
    localStorage.removeItem("user")
    setUser(null)
  }

  // Update user profile
  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  // Context value
  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
