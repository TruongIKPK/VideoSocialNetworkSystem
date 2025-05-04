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

    // Khởi tạo mảng savedBy nếu chưa có
    if (!video.savedBy) {
      video.savedBy = []
    }

    // Kiểm tra xem người dùng đã save video chưa
    const hasSaved = video.savedBy.includes(userId)
    let updateOperation;
    
    if (hasSaved) {
      // Bỏ save
      updateOperation = {
        $pull: { savedBy: userId },
        $inc: { saves: -1 }
      };
    } else {
      // Thêm save
      updateOperation = {
        $addToSet: { savedBy: userId },
        $inc: { saves: 1 }
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
      console.warn('Save operation did not modify any document');
    }

    // Trả về trạng thái save mới
    return NextResponse.json({
      saves: updatedVideo.saves || 0,
      hasSaved: !hasSaved // Trạng thái save mới sau thao tác
    })
  } catch (error) {
    console.error('Error saving video:', error)
    return NextResponse.json(
      { error: 'Failed to save video: ' + error.message },
      { status: 500 }
    )
  }
}