// Simulated API functions for the Looply app

// Fetch videos from the server
export async function fetchVideos() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock data
  return [
    {
      id: "1",
      title: "Cat playing",
      url: "/videos/video2.mp4",
      thumbnail: "/videos/video2.mp4?height=720&width=1280",
      likes: 94600000,
      comments: 32900,
      saves: 81700,
      shares: 9900,
      user: {
        id: "101",
        name: "Abdul_Hakim_Zayd",
        avatar: "/placeholder.svg?height=50&width=50",
        verified: true,
      },
    },
    {
      id: "2",
      title: "Beach sunset",
      url: "/videos/video1.mp4",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      likes: 45600,
      comments: 2100,
      saves: 8700,
      shares: 1200,
      user: {
        id: "102",
        name: "SunsetLover",
        avatar: "/placeholder.svg?height=50&width=50",
        verified: false,
      },
    },
    {
      id: "3",
      title: "Mountain hiking",
      url: "/videos/video3.mp4",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      likes: 78900,
      comments: 4500,
      saves: 12300,
      shares: 3400,
      user: {
        id: "103",
        name: "AdventureTime",
        avatar: "/placeholder.svg?height=50&width=50",
        verified: true,
      },
    },
  ]
}

// Fetch comments for a video
export async function fetchComments(videoId) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return mock data
  return [
    {
      id: "1001",
      text: "Video hay quá!",
      timestamp: "2 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "1002",
      text: "Video hay quá!",
      timestamp: "3 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "1003",
      text: "Video hay quá!",
      timestamp: "5 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "1004",
      text: "Video hay quá!",
      timestamp: "6 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "1005",
      text: "Video hay quá!",
      timestamp: "8 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "1006",
      text: "Video hay quá!",
      timestamp: "10 giờ trước",
      user: {
        id: "201",
        name: "Thanh Hiền",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
  ]
}

// Add a comment to a video
export async function addComment(videoId, text) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return mock data
  return {
    id: Math.random().toString(36).substr(2, 9),
    text,
    timestamp: "Vừa xong",
    user: JSON.parse(localStorage.getItem("user")),
  }
}

// Fetch user videos
export async function fetchUserVideos(userId) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock data
  return [
    {
      id: "301",
      title: "Cat playing",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      views: 12500,
    },
    {
      id: "302",
      title: "Beach sunset",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      views: 8700,
    },
    {
      id: "303",
      title: "Mountain hiking",
      thumbnail: "/placeholder.svg?height=720&width=1280",
      views: 5400,
    },
  ]
}

// Login user
export async function loginUser(email, password) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In a real app, this would validate credentials with a server
  // For demo purposes, we'll just return a mock user
  return {
    id: "1001",
    name: "Hin Day Ni",
    username: "hindayni",
    email,
    avatar: "/placeholder.svg?height=100&width=100",
    following: 1,
    followers: 1000000,
    likes: 153450,
  }
}

// Register user
export async function registerUser(name, email, password) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In a real app, this would create a new user in the database
  // For demo purposes, we'll just return a mock user
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    username: name.toLowerCase().replace(/\s+/g, "_"),
    email,
    avatar: "/placeholder.svg?height=100&width=100",
    following: 0,
    followers: 0,
    likes: 0,
  }
}

// Update user profile
export async function updateUserProfile(userId, data) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // In a real app, this would update the user in the database
  // For demo purposes, we'll just return the updated data
  const user = JSON.parse(localStorage.getItem("user"))
  return { ...user, ...data }
}

// Upload video
export async function uploadVideo(file, title, description, onProgress) {
  // Simulate API call with progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    onProgress(i)
  }

  // In a real app, this would upload the video to a server
  // For demo purposes, we'll just return a mock response
  return {
    id: Math.random().toString(36).substr(2, 9),
    title,
    description,
    url: URL.createObjectURL(file),
    thumbnail: "/placeholder.svg?height=720&width=1280",
  }
}
