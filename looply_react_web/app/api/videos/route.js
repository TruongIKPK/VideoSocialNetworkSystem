import { NextResponse } from 'next/server'
import { connectDB } from '../mongodb/route'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const db = await connectDB()
    const videos = await db.collection('videos').find({}).toArray()
    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const videoData = await request.json()
    const db = await connectDB()
    
    const result = await db.collection('videos').insertOne({
      ...videoData,
      createdAt: new Date().toISOString()
    })
    
    return NextResponse.json({ ...videoData, _id: result.insertedId })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!videoId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    
    // Tìm video để kiểm tra quyền sở hữu
    const videoObjectId = new ObjectId(videoId)
    const video = await db.collection('videos').findOne({ _id: videoObjectId })
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    
    // Kiểm tra nếu người dùng là chủ sở hữu của video
    const videoOwnerId = video.user?._id || video.userId
    
    if (videoOwnerId !== userId && videoOwnerId?.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own videos' },
        { status: 403 }
      )
    }
    
    // Thực hiện xóa video
    const result = await db.collection('videos').deleteOne({ _id: videoObjectId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video: ' + error.message },
      { status: 500 }
    )
  }
}