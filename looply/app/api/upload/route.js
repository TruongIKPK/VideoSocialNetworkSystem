import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const title = formData.get('title')
    const description = formData.get('description')
    const user = JSON.parse(formData.get('user'))

    if (!file || !title || !user) {
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
        // You can emit this progress to the client if needed
        console.log(`Upload progress: ${percent}%`)
      })

      uploadStream.end(buffer)
    })

    // Read existing videos data
    const videosDataPath = path.join(process.cwd(), 'data', 'videos.json')
    const videosData = JSON.parse(fs.readFileSync(videosDataPath, 'utf-8'))

    // Create new video object
    const newVideo = {
      id: result.public_id,
      title,
      description,
      url: result.secure_url,
      thumbnail: result.secure_url.replace('.mp4', '.jpg'),
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      user,
      createdAt: new Date().toISOString()
    }

    // Add new video to videos array
    videosData.videos.push(newVideo)

    // Save updated videos data
    fs.writeFileSync(videosDataPath, JSON.stringify(videosData, null, 2))

    return NextResponse.json(newVideo)
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
} 