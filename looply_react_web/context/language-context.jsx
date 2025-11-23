"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Create context for language
const LanguageContext = createContext()

// Custom hook to use the language context
export function useLanguage() {
  return useContext(LanguageContext)
}

// Provider component for language
export function LanguageProvider({ children }) {
  // State for language
  const [language, setLanguage] = useState("en")

  // Load language preference from localStorage on component mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("language")
    if (storedLanguage) {
      setLanguage(storedLanguage)
    }
  }, [])

  // Update language preference
  const changeLanguage = (lang) => {
    localStorage.setItem("language", lang)
    setLanguage(lang)
  }

  // Context value
  const value = {
    language,
    changeLanguage,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
