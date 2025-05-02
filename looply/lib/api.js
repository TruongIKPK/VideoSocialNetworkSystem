// Simulated API functions for the Looply app

// Đọc danh sách người dùng từ API
async function readUsersFromAPI() {
  const url = new URL('/api/mongodb', window.location.origin)
  url.searchParams.append('collection', 'users')
  url.searchParams.append('action', 'find')
  
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return await response.json()
}

// Ghi danh sách người dùng vào API
async function writeUsersToAPI(user) {
  const url = new URL('/api/mongodb', window.location.origin)
  url.searchParams.append('collection', 'users')
  url.searchParams.append('action', 'insertOne')
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    throw new Error('Failed to save user')
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

// Hàm kiểm tra tất cả người dùng trong database
export async function getAllUsers() {
  try {
    const url = new URL('/api/mongodb', window.location.origin)
    url.searchParams.append('collection', 'users')
    url.searchParams.append('action', 'find')
    
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching all users:', error)
    throw error
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    console.log('Attempting to login with:', { email, password })
    
    // Tìm người dùng có email khớp
    const url = new URL('/api/mongodb', window.location.origin)
    url.searchParams.append('collection', 'users')
    url.searchParams.append('action', 'findOne')
    url.searchParams.append('query', JSON.stringify({ email }))
    
    console.log('Fetching user with URL:', url.toString())
    const response = await fetch(url.toString())
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }
    
    const user = await response.json()
    console.log('Raw user data from MongoDB:', user)
    
    // Kiểm tra nếu user là null hoặc undefined
    if (!user) {
      console.log('No user found with email:', email)
      throw new Error("Email hoặc mật khẩu không đúng")
    }

    // Kiểm tra mật khẩu
    console.log('Comparing passwords:', {
      stored: user.password,
      provided: password
    })
    
    if (user.password !== password) {
      console.log('Password mismatch')
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
  try {
    console.log('Attempting to register user:', { name, email })
    
    // Kiểm tra email đã tồn tại chưa
    const checkUrl = new URL('/api/mongodb', window.location.origin)
    checkUrl.searchParams.append('collection', 'users')
    checkUrl.searchParams.append('action', 'findOne')
    checkUrl.searchParams.append('query', JSON.stringify({ email }))
    
    console.log('Checking existing user with URL:', checkUrl.toString())
    const checkResponse = await fetch(checkUrl.toString())
    console.log('Check response status:', checkResponse.status)
    
    if (!checkResponse.ok) {
      throw new Error('Failed to check existing user')
    }
    
    const existingUser = await checkResponse.json()
    console.log('Existing user check result:', existingUser)
    
    if (existingUser) {
      throw new Error("Email already exists")
    }

    // Tạo thông tin người dùng mới
    const newUser = {
      name,
      username: name.toLowerCase().replace(/\s+/g, "_"),
      email,
      password,
      avatar: "/no_avatar.png",
      following: 0,
      followers: 0,
      likes: 0,
      createdAt: new Date().toISOString()
    }

    console.log('Creating new user:', newUser)

    // Ghi người dùng mới vào API
    const url = new URL('/api/mongodb', window.location.origin)
    url.searchParams.append('collection', 'users')
    url.searchParams.append('action', 'insertOne')
    
    console.log('Saving user with URL:', url.toString())
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    })
    console.log('Save response status:', response.status)

    if (!response.ok) {
      throw new Error('Failed to register user')
    }

    const result = await response.json()
    console.log('Registration result:', result)
    return result
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Update user profile
export async function updateUserProfile(data) {
  try {
    // Lấy userId từ localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    if (!currentUser || !currentUser._id) {
      throw new Error('User not logged in')
    }

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('bio', data.bio)
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

    // Tạo URL cho MongoDB
    const url = new URL('/api/mongodb', window.location.origin)
    url.searchParams.append('collection', 'users')
    url.searchParams.append('action', 'updateOne')
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: { _id: currentUser._id },
        update: {
          $set: {
            name: data.name,
            bio: data.bio,
            ...(data.avatar && { avatar: data.avatar })
          }
        }
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update profile')
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
