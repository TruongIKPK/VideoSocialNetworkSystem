// Simulated API functions for the Looply app

// Đọc danh sách người dùng từ API với xử lý lỗi tốt hơn
async function readUsersFromAPI() {
  try {
    // Kiểm tra môi trường trước khi sử dụng window
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    const url = new URL('/api/mongodb', baseUrl);
    url.searchParams.append('collection', 'users');
    url.searchParams.append('action', 'find');
    
    console.log('Fetching users from:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error:', errorData);
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} users from database`);
    return data;
  } catch (error) {
    console.error('Error reading users from API:', error);
    // Trả về mảng rỗng thay vì throw lỗi để ứng dụng không bị crash
    return [];
  }
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
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    // Trích xuất ID thực từ cấu trúc MongoDB nếu cần
    let extractedId = userId;
    if (typeof userId === 'object' && userId !== null) {
      if (userId.$oid) {
        extractedId = userId.$oid;
      }
    } else if (typeof userId === 'string' && userId.includes('$oid')) {
      try {
        const parsed = JSON.parse(userId);
        extractedId = parsed.$oid || userId;
      } catch (e) {
        // Nếu không phải chuỗi JSON hợp lệ, giữ nguyên giá trị
      }
    }
    
    console.log('Fetching videos for user ID:', extractedId);
    
    const response = await fetch(`${baseUrl}/api/videos`, {
      headers: {
        'Cache-Control': 'no-cache', // Tránh cache
      },
      // Thiết lập thời gian chờ tối đa là 10 giây
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error when fetching videos:', errorData);
      throw new Error(errorData.error || 'Failed to fetch videos');
    }
    
    const allVideos = await response.json();
    console.log(`Retrieved ${allVideos.length} total videos, filtering for user: ${extractedId}`);
    
    // Lọc video theo userId với nhiều cấu trúc dữ liệu khác nhau có thể có
    const userVideos = allVideos.filter(video => {
      // Xử lý trường hợp video.user._id là object với $oid
      if (video.user && video.user._id && typeof video.user._id === 'object' && video.user._id.$oid) {
        return video.user._id.$oid === extractedId;
      }
      
      // Trường hợp 1: Nếu video có trường user.id
      if (video.user && video.user.id === extractedId) {
        return true;
      }
      
      // Trường hợp 2: Nếu video có trường user._id (string)
      if (video.user && video.user._id === extractedId) {
        return true;
      }
      
      // Trường hợp 3: Nếu video có trường userId trực tiếp
      if (video.userId === extractedId) {
        return true;
      }
      
      // Trường hợp 4: Video có thể lưu userId dưới dạng ObjectId string
      if (video.userId && video.userId.toString() === extractedId) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${userVideos.length} videos for user ${extractedId}`);
    return userVideos;
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return [];
  }
}

// Fetch videos that user has liked
export async function fetchLikedVideos(userId) {
  try {
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/videos`, {
      headers: {
        'Cache-Control': 'no-cache', // Tránh cache
      },
      // Thiết lập thời gian chờ tối đa là 10 giây
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error when fetching videos:', errorData);
      throw new Error(errorData.error || 'Failed to fetch videos');
    }
    
    const allVideos = await response.json();
    console.log(`Retrieved ${allVideos.length} total videos, finding liked videos for user: ${userId}`);
    
    // Lọc video có mảng likedBy chứa userId
    const likedVideos = allVideos.filter(video => 
      video.likedBy && 
      Array.isArray(video.likedBy) && 
      video.likedBy.includes(userId)
    );
    
    console.log(`Found ${likedVideos.length} liked videos for user ${userId}`);
    return likedVideos;
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    return [];
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

// Cập nhật thông tin người dùng
export async function updateUserProfile(data) {
  try {
    console.log('Starting profile update with data:', data);

    // Lấy _id từ localStorage
    const userData = localStorage.getItem('user');
    console.log('Raw user data from localStorage:', userData);
    
    if (!userData) {
      throw new Error('User not found in localStorage');
    }

    const parsedUserData = JSON.parse(userData);
    console.log('Parsed user data:', parsedUserData);
    
    const { _id } = parsedUserData;
    if (!_id) {
      throw new Error('User ID is required');
    }

    console.log('User ID:', _id);

    // Xử lý avatar nếu là file mới
    let avatarData = data.avatar;
    if (data.avatar instanceof File) {
      try {
        // Convert file to base64
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(data.avatar);
        });

        // Upload to Cloudinary using their API
        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            folder: 'avatars'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload avatar');
        }

        const result = await response.json();
        avatarData = result.secure_url;
        console.log('Avatar uploaded successfully:', avatarData);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        throw new Error('Failed to upload avatar: ' + error.message);
      }
    }

    // Gửi yêu cầu cập nhật đến API
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id,
        name: data.name,
        bio: data.bio,
        avatar: avatarData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const result = await response.json();
    console.log('Profile update result:', result);

    // Cập nhật localStorage
    const updatedUser = {
      ...parsedUserData,
      name: result.name || parsedUserData.name,
      bio: result.bio || parsedUserData.bio,
      avatar: result.avatar || parsedUserData.avatar || '/no_avatar.png', // Ensure avatar has a default value
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating localStorage with:', updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Upload video
export async function uploadVideo(file, title, description, onProgress) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('description', description)
    
    // Get user ID from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) {
      throw new Error('User not found')
    }
    const user = JSON.parse(userData)
    
    if (!user._id) {
      throw new Error('User ID is required')
    }
    
    formData.append('userId', user._id)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload video')
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
    // Lấy thông tin người dùng từ localStorage
    const userData = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!userData) {
      throw new Error('Bạn cần đăng nhập để thích video');
    }
    
    const user = JSON.parse(userData);
    if (!user._id && !user.id) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }
    
    // Sử dụng _id hoặc id tùy vào cấu trúc dữ liệu người dùng
    const userId = user._id || user.id;
    
    console.log('Sending like request for video:', videoId, 'by user:', userId);
    
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/videos/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Tránh cache
      },
      body: JSON.stringify({ 
        videoId,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Like video error:', errorData);
      throw new Error(errorData.error || 'Không thể thích video');
    }

    const result = await response.json();
    console.log('Like video result:', result);
    return result;
  } catch (error) {
    console.error('Error liking video:', error);
    throw error;
  }
}

// Upload avatar lên Cloudinary
export async function uploadAvatar(file) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'looply_avatars');

    const response = await fetch(`https://api.cloudinary.com/v1_1/dcnmynqty/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload avatar');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

// Xóa video
export async function deleteVideo(videoId) {
  try {
    // Lấy thông tin người dùng từ localStorage
    const userData = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!userData) {
      throw new Error('Bạn cần đăng nhập để xóa video');
    }
    
    const user = JSON.parse(userData);
    if (!user._id && !user.id) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }
    
    // Sử dụng _id hoặc id tùy vào cấu trúc dữ liệu người dùng
    const userId = user._id || user.id;
    
    console.log('Sending delete request for video:', videoId, 'by user:', userId);
    
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    const url = new URL(`${baseUrl}/api/videos`);
    url.searchParams.append('id', videoId);
    url.searchParams.append('userId', userId);
    
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache', // Tránh cache
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Delete video error:', errorData);
      throw new Error(errorData.error || 'Không thể xóa video');
    }

    const result = await response.json();
    console.log('Delete video result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

// Theo dõi/hủy theo dõi người dùng
export async function followUser(userId) {
  try {
    // Lấy thông tin người dùng từ localStorage
    const userData = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!userData) {
      throw new Error('Bạn cần đăng nhập để theo dõi người dùng');
    }
    
    const follower = JSON.parse(userData);
    if (!follower._id && !follower.id) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }
    
    // Sử dụng _id hoặc id tùy vào cấu trúc dữ liệu người dùng
    const followerId = follower._id || follower.id;
    
    console.log('Sending follow request:', { followerId, userId });
    
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/users/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // Tránh cache
      },
      body: JSON.stringify({ 
        followerId,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Follow user error:', errorData);
      throw new Error(errorData.error || 'Không thể theo dõi người dùng');
    }

    const result = await response.json();
    console.log('Follow user result:', result);
    
    // Cập nhật localStorage với số lượng following mới
    if (result.success && typeof window !== 'undefined') {
      try {
        const currentUserData = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
        currentUserData.following = result.followingCount;
        
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(currentUserData));
        }
        if (localStorage.getItem('currentUser')) {
          localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        }
      } catch (err) {
        console.error('Error updating localStorage:', err);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

// Lấy thông tin người dùng
export async function getUserProfile(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Thêm baseUrl để đảm bảo tương thích khi chạy ở server-side
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
      
    // Xử lý trường hợp ID là ObjectId hoặc string
    let queryParam = userId;
    if (typeof userId === 'object' && userId !== null) {
      if (userId.$oid) {
        queryParam = userId.$oid;
      }
    } else if (typeof userId === 'string') {
      // Nếu có dạng JSON với $oid
      if (userId.includes('$oid')) {
        try {
          const parsed = JSON.parse(userId);
          if (parsed.$oid) {
            queryParam = parsed.$oid;
          }
        } catch (e) {
          // Nếu không parse được, giữ nguyên giá trị
        }
      }
    }
    
    console.log('Fetching user with ID:', queryParam);
    
    // Cách 1: Thử truy vấn trực tiếp với ID
    const directUrl = new URL(`${baseUrl}/api/mongodb`);
    directUrl.searchParams.append('collection', 'users');
    directUrl.searchParams.append('action', 'findOne');
    directUrl.searchParams.append('query', JSON.stringify({ 
      _id: queryParam
    }));
    
    console.log('Trying direct query first:', directUrl.toString());
    
    let response = await fetch(directUrl.toString(), {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    let userData = null;
    
    if (response.ok) {
      userData = await response.json();
    }
    
    // Nếu không tìm thấy, thử cách khác với $or query
    if (!userData) {
      console.log('User not found with direct query, trying alternative methods');
      
      const alternativeUrl = new URL(`${baseUrl}/api/mongodb`);
      alternativeUrl.searchParams.append('collection', 'users');
      alternativeUrl.searchParams.append('action', 'findOne');
      
      // Tạo truy vấn với nhiều điều kiện để đảm bảo tìm được người dùng
      const orQuery = {
        $or: [
          { _id: queryParam },
          { "id": queryParam },
          { "username": queryParam }
        ]
      };
      
      console.log('Trying $or query:', JSON.stringify(orQuery));
      alternativeUrl.searchParams.append('query', JSON.stringify(orQuery));
      
      response = await fetch(alternativeUrl.toString(), {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        userData = await response.json();
      }
    }
    
    // Nếu vẫn không tìm thấy, thử tìm tất cả user và debug
    if (!userData) {
      console.log('Still not found, getting all users to debug');
      
      const allUsersUrl = new URL(`${baseUrl}/api/mongodb`);
      allUsersUrl.searchParams.append('collection', 'users');
      allUsersUrl.searchParams.append('action', 'find');
      
      response = await fetch(allUsersUrl.toString(), {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        const allUsers = await response.json();
        console.log(`Found ${allUsers.length} total users in database`);
        
        if (allUsers.length > 0) {
          // Log ra một vài user để debug
          console.log('Sample users:', allUsers.slice(0, 2).map(u => ({
            _id: u._id,
            name: u.name,
            username: u.username
          })));
          
          // Tìm user có ID tương tự trong danh sách
          const foundUser = allUsers.find(u => {
            // Kiểm tra trường hợp _id là object với $oid
            if (u._id && typeof u._id === 'object' && u._id.$oid === queryParam) {
              return true;
            }
            
            // Kiểm tra trường hợp _id là string
            if (u._id === queryParam) {
              return true;
            }
            
            return false;
          });
          
          if (foundUser) {
            console.log('Found user by manual search:', foundUser.name);
            userData = foundUser;
          }
        }
      }
    }
    
    if (!userData) {
      console.error('User not found with ID:', queryParam);
      throw new Error('User not found');
    }
    
    // Kiểm tra xem người dùng hiện tại đã theo dõi người dùng này chưa
    let isFollowingUser = false;
    const currentUserData = localStorage.getItem('user') || localStorage.getItem('currentUser');
    
    if (currentUserData && userData) {
      const currentUser = JSON.parse(currentUserData);
      const currentUserId = currentUser._id || currentUser.id;
      
      // Kiểm tra trong danh sách follower của người dùng đang xem
      if (userData.followersList && Array.isArray(userData.followersList)) {
        isFollowingUser = userData.followersList.some(id => {
          // So sánh cả trường hợp ObjectId và string
          if (typeof id === 'object' && id.$oid) {
            return id.$oid === currentUserId;
          }
          return id === currentUserId || id.toString() === currentUserId;
        });
      }
    }
    
    return { ...userData, isFollowingUser };
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}
