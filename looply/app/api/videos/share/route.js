import { NextResponse } from 'next/server'
import { connectDB } from '../../mongodb/route'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { videoId, userId } = await request.json()

    if (!videoId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Kết nối đến MongoDB
    const db = await connectDB()
    
    // Chuyển đổi videoId sang ObjectId nếu cần
    let videoObjectId;
    try {
      videoObjectId = new ObjectId(videoId);
    } catch (error) {
      console.error('Invalid video ID format:', error);
      return NextResponse.json(
        { error: 'Invalid video ID format' },
        { status: 400 }
      );
    }
    
    // Tìm video trong collection videos
    const video = await db.collection('videos').findOne({ _id: videoObjectId });
    
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
    
    // Tăng số lượt chia sẻ lên 1
    const currentShares = video.shares || 0
    const newShares = currentShares + 1
    
    // Cập nhật thông tin video trong database
    const result = await db.collection('videos').updateOne(
      { _id: videoObjectId },
      { $set: { shares: newShares } }
    )
    
    // Tìm video đã cập nhật để trả về thông tin mới
    const updatedVideo = await db.collection('videos').findOne({ _id: videoObjectId });
    
    if (!result.modifiedCount) {
      console.warn('Share operation did not modify any document');
    }

    // Trả về trạng thái mới
    return NextResponse.json({
      shares: updatedVideo.shares || 0
    })
  } catch (error) {
    console.error('Error sharing video:', error)
    return NextResponse.json(
      { error: 'Failed to share video: ' + error.message },
      { status: 500 }
    )
  }
}