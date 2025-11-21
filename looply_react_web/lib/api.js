// API functions for the Looply app using loopy_server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://videosocialnetworksystem.onrender.com/api';

// Helper to get the base URL (not strictly needed if we hardcode, but good for flexibility if we want to use env vars later)
// For this refactor, we are using the provided domain directly.

// --- User Related Functions ---

// Đọc danh sách người dùng từ API
export async function readUsersFromAPI() {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      'Cache-Control': 'no-cache',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Fetching users from:', `${API_BASE_URL}/users`);
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      // If 401/403, return empty list instead of throwing to prevent app crash on public pages
      if (response.status === 401 || response.status === 403) {
        console.log('User not authenticated, returning empty user list.');
        return [];
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('Server error:', errorData);
      throw new Error(errorData.message || 'Failed to fetch users');
    }

    const data = await response.json();
    console.log(`Retrieved ${data.length} users`);
    return data;
  } catch (error) {
    console.error('Error reading users from API:', error);
    return [];
  }
}

// Ghi danh sách người dùng vào API (Actually Register)
// Note: The original function seemed to be a generic "write" but was used for creating users.
// We map this to register.
export async function writeUsersToAPI(user) {
  return registerUser(user.name, user.email, user.password);
}

// Hàm kiểm tra tất cả người dùng trong database
export async function getAllUsers() {
  return await readUsersFromAPI();
}

// Login user
export async function loginUser(email, password) {
  try {
    console.log('Attempting to login with:', { email })

    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('Login failed:', data);
      throw new Error(data.message || "Email hoặc mật khẩu không đúng");
    }

    console.log('Login successful:', data);

    // The server returns { user: {...}, token: "..." }
    const user = data.user;
    const token = data.token;

    // Lưu thông tin người dùng và token vào localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user)); // Keep both for compatibility
      localStorage.setItem('token', token);
    }

    return user;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error)
    throw error
  }
}

// Register user
export async function registerUser(name, email, password) {
  try {
    console.log('Attempting to register user:', { name, email })

    // Generate a username from name if not provided (though server might handle it, we'll send what we have)
    const username = name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);

    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        username,
        email,
        password
      }),
    })

    const data = await response.json();

    if (!response.ok) {
      console.error('Registration failed:', data);
      throw new Error(data.message || 'Failed to register user');
    }

    console.log('Registration result:', data);
    return data;
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Cập nhật thông tin người dùng
export async function updateUserProfile(data) {
  try {
    console.log('Starting profile update with data:', data);

    // Lấy _id và token từ localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      throw new Error('User not authenticated');
    }

    const parsedUserData = JSON.parse(userData);
    const { _id } = parsedUserData;

    if (!_id) {
      throw new Error('User ID is required');
    }

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('bio', data.bio || '');

    if (data.avatar instanceof File) {
      formData.append('avatar', data.avatar);
    }

    // Gửi yêu cầu cập nhật đến API
    // Endpoint: PUT /api/users/profile/:id
    const response = await fetch(`${API_BASE_URL}/users/profile/${_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type is automatically set with FormData
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update profile');
    }

    console.log('Profile update result:', result);

    // Cập nhật localStorage
    // The server returns the updated user object directly
    const updatedUser = {
      ...parsedUserData,
      ...result
    };

    console.log('Updating localStorage with:', updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// --- Video Related Functions ---

// Fetch videos from the server
export async function fetchVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`)
    if (!response.ok) {
      throw new Error('Failed to fetch videos')
    }
    const data = await response.json();
    // Server returns array of videos directly or { total, videos } depending on endpoint?
    // Checking videoController.js: getAllVideos returns res.json(videos) (array)
    return Array.isArray(data) ? data : (data.videos || []);
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

// Fetch a video by ID
export async function fetchVideoById(videoId) {
  try {
    // Handle ObjectId format if passed as object
    let normalizedVideoId = videoId;
    if (typeof videoId === 'object' && videoId !== null && videoId.$oid) {
      normalizedVideoId = videoId.$oid;
    }

    console.log('Fetching video with ID:', normalizedVideoId);

    const response = await fetch(`${API_BASE_URL}/videos/${normalizedVideoId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error when fetching video:', errorData);
      throw new Error(errorData.message || 'Failed to fetch video');
    }

    const video = await response.json();
    return video;
  } catch (error) {
    console.error('Error fetching video by ID:', error);
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

    // Get user ID and token from localStorage
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      throw new Error('User not authenticated')
    }
    const user = JSON.parse(userData)
    const userId = user._id || user.id;

    if (!userId) {
      throw new Error('User ID is required')
    }

    formData.append('userId', userId)

    // Log form data for debugging
    console.log('Uploading video with data:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }

    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.message || 'Failed to upload video';
      console.log('Server error when uploading video:', errorMessage);
      if (errorMessage.includes('api_key')) {
        throw new Error(`Server Error: ${errorMessage}. Please ensure you are running the LOCAL server with Cloudinary configured.`);
      }
      throw new Error(errorMessage)
    }

    return data
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

// Delete video
export async function deleteVideo(videoId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    let normalizedVideoId = videoId;
    if (typeof videoId === 'object' && videoId !== null && videoId.$oid) {
      normalizedVideoId = videoId.$oid;
    }

    const response = await fetch(`${API_BASE_URL}/videos/${normalizedVideoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete video');
    }

    return data;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

// Fetch user videos
// Note: Server doesn't have a specific "get videos by user" endpoint in the main list, 
// so we fetch all and filter.
export async function fetchUserVideos(userId) {
  try {
    let extractedId = userId;
    if (typeof userId === 'object' && userId !== null && userId.$oid) {
      extractedId = userId.$oid;
    }

    console.log('Fetching videos for user ID:', extractedId);

    const allVideos = await fetchVideos();

    const userVideos = allVideos.filter(video => {
      // Check various user ID locations
      if (video.user && video.user._id === extractedId) return true;
      if (video.user && video.user.id === extractedId) return true;
      if (video.userId === extractedId) return true;
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
// Note: Server doesn't have "get liked videos", so we filter client side.
export async function fetchLikedVideos(userId) {
  try {
    // This is tricky because the video object from getAllVideos might not contain the full list of likers 
    // if it's optimized, but based on videoController.js, it returns the video document.
    // However, the video schema usually stores likes count, and Likes are in a separate collection.
    // The server's getAllVideos does NOT join with Likes collection to get the list of likers for every video.
    // It only counts likes.
    // So strictly speaking, we CANNOT get liked videos efficiently without a new endpoint.
    // BUT, for now, we will try to fetch all videos and see if 'likedBy' exists (legacy) or if we can't do it.
    // Looking at videoController.js, it returns `likes` count, not the list of users who liked.
    // So this feature is BROKEN with the new server unless we add an endpoint.
    // I will return empty array and log a warning.
    console.warn("fetchLikedVideos is not fully supported by the current server API (missing endpoint). Returning empty list.");
    return [];
  } catch (error) {
    console.error('Error fetching liked videos:', error);
    return [];
  }
}

// Fetch videos that user has saved
export async function fetchSavedVideos(userId) {
  console.warn("fetchSavedVideos is not supported by the server API. Returning empty list.");
  return [];
}

// --- Comment Related Functions ---

// Fetch comments for a video
export async function fetchComments(videoId) {
  try {
    let normalizedVideoId = videoId;
    if (typeof videoId === 'object' && videoId !== null && videoId.$oid) {
      normalizedVideoId = videoId.$oid;
    }

    console.log('Fetching comments for video:', normalizedVideoId);

    const response = await fetch(`${API_BASE_URL}/comments/${normalizedVideoId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch comments');
    }

    const data = await response.json();
    // Server returns { total, comments }
    return data.comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// Add a comment to a video
export async function addComment(videoId, text, parentId = null) {
  try {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      throw new Error('Bạn cần đăng nhập để bình luận');
    }

    const user = JSON.parse(userData);
    const userId = user._id || user.id;

    let normalizedVideoId = videoId;
    if (typeof videoId === 'object' && videoId !== null && videoId.$oid) {
      normalizedVideoId = videoId.$oid;
    }

    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        videoId: normalizedVideoId,
        content: text, // Server expects 'content', frontend sent 'text'
        parentId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể thêm bình luận');
    }

    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// --- Interaction Functions ---

// Like a video
export async function likeVideo(videoId) {
  try {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      throw new Error('Bạn cần đăng nhập để thích video');
    }

    const user = JSON.parse(userData);
    const userId = user._id;

    console.log('Sending like request for video:', videoId);

    const response = await fetch(`${API_BASE_URL}/likes/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        targetId: videoId,
        targetType: 'video',
        userId // Server controller uses userId from body, though it should probably use req.user
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If already liked, try unlike? Or just throw?
      // The UI usually handles toggle. If this function is just "like", then error is appropriate if already liked.
      // But if the UI expects a toggle, we might need to handle "already liked" by calling unlike.
      // For now, let's assume the UI calls this when it wants to LIKE.
      throw new Error(data.message || 'Không thể thích video');
    }

    return data;
  } catch (error) {
    console.error('Error liking video:', error);
    throw error;
  }
}

// Unlike a video
export async function unlikeVideo(videoId) {
  try {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      throw new Error('Bạn cần đăng nhập để bỏ thích video');
    }

    const user = JSON.parse(userData);
    const userId = user._id || user.id;

    console.log('Sending unlike request for video:', videoId);

    const response = await fetch(`${API_BASE_URL}/likes/unlike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        targetId: videoId,
        targetType: 'video',
        userId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể bỏ thích video');
    }

    return data;
  } catch (error) {
    console.error('Error unliking video:', error);
    throw error;
  }
}

// Check if video is liked
export async function checkVideoLiked(videoId) {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return false;

    const user = JSON.parse(userData);
    const userId = user._id || user.id;

    let normalizedVideoId = videoId;
    if (typeof videoId === 'object' && videoId !== null && videoId.$oid) {
      normalizedVideoId = videoId.$oid;
    }

    const response = await fetch(`${API_BASE_URL}/likes/check?userId=${userId}&targetType=video&targetId=${normalizedVideoId}`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isLiked;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

// Save video
export async function saveVideo(videoId) {
  console.warn("saveVideo is not supported by the server API.");
  // Return a fake success to not break UI, but nothing happens on server
  return { message: "Feature not supported" };
}

// Share video
export async function shareVideo(videoId) {
  // Share usually just copies link or opens native share, often no API call needed unless tracking shares
  // We'll just log it.
  console.log("Share video:", videoId);
  return { success: true };
}
