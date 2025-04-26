import fs from 'fs'
import path from 'path'
import { IncomingForm } from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Tạo thư mục uploads nếu chưa tồn tại
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image/')
      }
    })

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err)
          reject(err)
        }
        resolve([fields, files])
      })
    })

    // Kiểm tra các trường bắt buộc
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name
    const bio = Array.isArray(fields.bio) ? fields.bio[0] : fields.bio

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }
    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    // Đọc danh sách người dùng từ file JSON
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    let users = []
    try {
      users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))
    } catch (error) {
      console.error('Error reading users file:', error)
      return res.status(500).json({ message: 'Error reading users data' })
    }

    // Tìm và cập nhật người dùng
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      console.error('User not found with ID:', userId)
      return res.status(404).json({ message: 'User not found' })
    }

    // Xử lý avatar
    let avatarPath = users[userIndex].avatar
    let avatarFile = files.avatar
    if (Array.isArray(avatarFile)) {
      avatarFile = avatarFile[0]
    }
    if (avatarFile && avatarFile.newFilename) {
      const oldAvatar = users[userIndex].avatar
      if (oldAvatar && oldAvatar !== '/no_avatar.png') {
        const oldAvatarPath = path.join(process.cwd(), 'public', oldAvatar)
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath)
        }
      }
      avatarPath = `/uploads/${avatarFile.newFilename}`
    }

    // Cập nhật thông tin người dùng
    users[userIndex] = {
      ...users[userIndex],
      name,
      bio: bio || '',
      avatar: avatarPath
    }

    // Lưu lại vào file JSON
    try {
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
    } catch (error) {
      console.error('Error writing users file:', error)
      return res.status(500).json({ message: 'Error saving user data' })
    }

    return res.status(200).json(users[userIndex])
  } catch (error) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ message: error.message || 'Error updating profile' })
  }
} 