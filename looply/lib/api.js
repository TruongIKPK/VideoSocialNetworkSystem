// Simulated API functions for the Looply app

// Đọc danh sách người dùng từ API
async function readUsersFromAPI() {
  const response = await fetch('/api/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return await response.json()
}

// Ghi danh sách người dùng vào API
async function writeUsersToAPI(users) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(users),
  })
  if (!response.ok) {
    throw new Error('Failed to save users')
  }
  return await response.json()
}

// Mảng người dùng được khởi tạo từ API
let users = []
readUsersFromAPI().then(data => {
  users = data
})

// Fetch videos from the server
export async function fetchVideos() {
  try {
    const response = await fetch('/api/videos')
    if (!response.ok) {
      throw new Error('Failed to fetch videos')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
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
  try {
    const response = await fetch('/api/videos')
    if (!response.ok) {
      throw new Error('Failed to fetch videos')
    }
    const allVideos = await response.json()
    // Lọc video theo userId
    return allVideos.filter(video => video.user.id === userId)
  } catch (error) {
    console.error('Error fetching user videos:', error)
    return []
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    // Đọc danh sách người dùng từ API
    const users = await readUsersFromAPI()
    
    // Tìm người dùng có email và mật khẩu khớp
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng")
    }

    // Lưu thông tin người dùng vào localStorage để sử dụng sau này
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Lỗi đăng nhập:", error)
    throw error
  }
}

// Register user
export async function registerUser(name, email, password) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Kiểm tra email đã tồn tại chưa
  const existingUser = users.find((u) => u.email === email)
  if (existingUser) {
    throw new Error("Email already exists")
  }

  // Tạo thông tin người dùng mới
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    username: name.toLowerCase().replace(/\s+/g, "_"),
    email,
    password, // Lưu mật khẩu (nên mã hóa trong thực tế)
    avatar: "/no_avatar.png",
    following: 0,
    followers: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  }

  try {
    // Thêm người dùng mới vào mảng
    users.push(newUser)

    // Ghi mảng người dùng vào API
    await writeUsersToAPI(users)

    return newUser
  } catch (error) {
    console.error("Error registering user:", error)
    throw new Error("Failed to register user")
  }
}

// Update user profile
export async function updateUserProfile(data) {
  try {
    // Kiểm tra userId
    if (!data.userId) {
      throw new Error('User ID is required')
    }

    const formData = new FormData()
    formData.append('userId', data.userId)
    formData.append('name', data.name)
    formData.append('bio', data.bio)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

    const response = await fetch('/api/users/update', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update profile')
    }

    const updatedUser = await response.json()
    
    // Cập nhật thông tin người dùng trong localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    }

    return updatedUser
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

// Upload video
export async function uploadVideo(file, title, description, onProgress) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('description', description)
    formData.append('user', JSON.stringify(JSON.parse(localStorage.getItem('currentUser'))))

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      onProgress(i)
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload video')
    }

    return await response.json()
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

// Like a video
export async function likeVideo(videoId) {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'))
    if (!user) {
      throw new Error('User not logged in')
    }

    const response = await fetch('/api/videos/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        videoId,
        userId: user.id 
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to like video')
    }

    return await response.json()
  } catch (error) {
    console.error('Error liking video:', error)
    throw error
  }
}
