import { NextResponse } from 'next/server'
import { connectDB } from '../mongodb/route'

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