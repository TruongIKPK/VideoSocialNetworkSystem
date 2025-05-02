import { connectDB } from '../../../app/api/mongodb/route'
import { ObjectId } from 'mongodb'
import cloudinary from '@/lib/cloudinary'
import formidable from 'formidable'

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
    // Parse form data
    const form = formidable({})
    const [fields, files] = await form.parse(req)

    console.log('Fields:', fields)
    console.log('Files:', files)

    const userId = fields.userId?.[0]
    const name = fields.name?.[0]
    const bio = fields.bio?.[0]
    const avatarFile = files.avatar?.[0]

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const db = await connectDB()
    
    // Tạo object cập nhật
    const updates = {}
    if (name) updates.name = name
    if (bio) updates.bio = bio

    // Xử lý upload ảnh nếu có
    if (avatarFile) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'avatars',
              format: 'jpg',
              transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error)
              resolve(result)
            }
          ).end(avatarFile.buffer)
        })
        updates.avatar = result.secure_url
      } catch (error) {
        console.error('Error uploading avatar:', error)
        return res.status(500).json({ error: 'Failed to upload avatar' })
      }
    }

    // Kiểm tra nếu không có trường nào để cập nhật
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    console.log('Updates:', updates)
    console.log('User ID:', userId)

    // Cập nhật thông tin người dùng
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Lấy thông tin người dùng đã cập nhật
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    
    return res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return res.status(500).json({ error: error.message || 'Failed to update user profile' })
  }
}