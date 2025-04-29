import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
  try {
    const { videoId, userId } = await request.json()

    if (!videoId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Read videos data
    const videosDataPath = path.join(process.cwd(), 'data', 'videos.json')
    const videosData = JSON.parse(fs.readFileSync(videosDataPath, 'utf-8'))

    // Find the video
    const video = videosData.videos.find(v => v.id === videoId)
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Initialize likedBy array if it doesn't exist
    if (!video.likedBy) {
      video.likedBy = []
    }

    // Check if user has already liked the video
    const hasLiked = video.likedBy.includes(userId)

    if (hasLiked) {
      // Remove like
      video.likedBy = video.likedBy.filter(id => id !== userId)
      video.likes = Math.max(0, video.likes - 1)
    } else {
      // Add like
      video.likedBy.push(userId)
      video.likes = (video.likes || 0) + 1
    }

    // Save updated data
    fs.writeFileSync(videosDataPath, JSON.stringify(videosData, null, 2))

    // Return updated like status for the user
    return NextResponse.json({
      likes: video.likes,
      hasLiked: !hasLiked // Indicate whether the user has liked the video after the operation
    })
  } catch (error) {
    console.error('Error liking video:', error)
    return NextResponse.json(
      { error: 'Failed to like video' },
      { status: 500 }
    )
  }
}