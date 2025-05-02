import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { connectDB } from '../mongodb/route'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const title = formData.get('title')
    const description = formData.get('description')
    const userId = formData.get('userId')

    if (!file || !title || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Cloudinary with progress tracking
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'videos',
          format: 'mp4',
          chunk_size: 6000000, // 6MB chunks for better progress tracking
        },
        (error, result) => {
          if (error) reject(error)
          resolve(result)
        }
      )

      // Handle upload progress
      uploadStream.on('progress', (progress) => {
        const percent = Math.round((progress.bytes_written / progress.bytes_total) * 100)
        console.log(`Upload progress: ${percent}%`)
      })

      uploadStream.end(buffer)
    })

    // Get user information from database
    const db = await connectDB()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 1, name: 1, avatar: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create new video object
    const newVideo = {
      title,
      description,
      url: result.secure_url,
      thumbnail: result.secure_url.replace('.mp4', '.jpg'),
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      user: {
        _id: user._id.toString(), // Convert ObjectId to string
        name: user.name,
        avatar: user.avatar || '/no_avatar.png' // Use default avatar if none exists
      },
      createdAt: new Date().toISOString()
    }

    // Save to MongoDB
    const videoResult = await db.collection('videos').insertOne(newVideo)

    return NextResponse.json({ ...newVideo, _id: videoResult.insertedId })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
} 