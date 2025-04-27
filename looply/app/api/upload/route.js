import { NextResponse } from 'next/server'
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

    // Create videos directory if it doesn't exist
    const videosDir = path.join(process.cwd(), 'public', 'videos')
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}.${fileExtension}`
    const filePath = path.join(videosDir, fileName)

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Read existing videos data
    const videosDataPath = path.join(process.cwd(), 'data', 'videos.json')
    const videosData = JSON.parse(fs.readFileSync(videosDataPath, 'utf-8'))

    // Create new video object
    const newVideo = {
      id: timestamp.toString(),
      title,
      description,
      url: `/videos/${fileName}`,
      thumbnail: `/videos/${fileName}?height=720&width=1280`,
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