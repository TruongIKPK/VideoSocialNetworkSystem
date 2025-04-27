import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const videosDataPath = path.join(process.cwd(), 'data', 'videos.json')
    const videosData = JSON.parse(fs.readFileSync(videosDataPath, 'utf-8'))
    return NextResponse.json(videosData.videos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
} 