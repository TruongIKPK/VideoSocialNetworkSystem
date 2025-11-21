import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to save data to localStorage
export function saveToLocalStorage(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

// Function to get data from localStorage
export function getFromLocalStorage(key: string): any {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error getting from localStorage:", error)
    return null
  }
}

// Function to remove data from localStorage
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error("Error removing from localStorage:", error)
    return false
  }
}

// Function to format view count
export function formatCount(count: number): string {
  if (count === undefined || count === null || isNaN(count)) {
    return "0"
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M"
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K"
  }
  return count.toString()
}

// Function to format time ago
export function formatTimeAgo(date: string | Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " years ago"
  }

  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " months ago"
  }

  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " days ago"
  }

  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " hours ago"
  }

  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago"
  }

  return Math.floor(seconds) + " seconds ago"
}

// Function to validate email
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(email).toLowerCase())
}

// Function to generate a random avatar
export function generateAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
}

// Normalize MongoDB data by handling $oid and $numberInt fields
export function normalizeMongoData(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => normalizeMongoData(item));
  }

  if (typeof data === 'object' && data !== null) {
    // Deep copy to avoid mutation
    const result: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (key === '$oid') {
        // If this is an $oid object, return the string value directly
        return value;
      }

      if (key === '$numberInt' || key === '$numberLong' || key === '$numberDouble') {
        // Convert number values
        return Number(value);
      }

      // Process nested objects/arrays
      result[key] = normalizeMongoData(value);
    }

    return result;
  }

  return data;
}
