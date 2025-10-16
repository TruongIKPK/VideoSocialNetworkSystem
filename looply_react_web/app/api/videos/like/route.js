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

    // Khởi tạo mảng likedBy nếu chưa có
    if (!video.likedBy) {
      video.likedBy = []
    }

    // Kiểm tra xem người dùng đã like video chưa
    const hasLiked = video.likedBy.includes(userId)
    let updateOperation;
    
    if (hasLiked) {
      // Bỏ like
      updateOperation = {
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      };
    } else {
      // Thêm like
      updateOperation = {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 }
      };
    }

    // Cập nhật video trong database
    const result = await db.collection('videos').updateOne(
      { _id: videoObjectId },
      updateOperation
    );
    
    // Lấy video đã cập nhật
    const updatedVideo = await db.collection('videos').findOne({ _id: videoObjectId });
    
    if (!result.modifiedCount) {
      console.warn('Like operation did not modify any document');
    }

    // Trả về trạng thái like mới
    return NextResponse.json({
      likes: updatedVideo.likes || 0,
      hasLiked: !hasLiked // Trạng thái like mới sau thao tác
    })
  } catch (error) {
    console.error('Error liking video:', error)
    return NextResponse.json(
      { error: 'Failed to like video: ' + error.message },
      { status: 500 }
    )
  }
}