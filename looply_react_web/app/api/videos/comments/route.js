import { NextResponse } from 'next/server'
import { connectDB } from '../../mongodb/route'
import { ObjectId } from 'mongodb'

// Lấy danh sách bình luận cho video
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    
    // Tìm tất cả bình luận cho video này
    let videoObjectId;
    try {
      videoObjectId = new ObjectId(videoId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid video ID format' },
        { status: 400 }
      );
    }
    
    const pipeline = [
      {
        $match: { videoId: videoObjectId }
      },
      {
        $sort: { createdAt: -1 } // Sắp xếp theo thời gian mới nhất
      },
      {
        // Lookup để lấy thông tin người dùng
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] }
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ],
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Lookup để lấy thông tin trả lời (replies)
        $lookup: {
          from: 'comments',
          let: { commentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$parentId', '$$commentId'] }
              }
            },
            {
              $sort: { createdAt: 1 }
            },
            {
              // Lookup thông tin người dùng cho replies
              $lookup: {
                from: 'users',
                let: { replyUserId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$_id', '$$replyUserId'] }
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      username: 1,
                      avatar: 1
                    }
                  }
                ],
                as: 'replyUserInfo'
              }
            },
            {
              $unwind: {
                path: '$replyUserInfo',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                text: 1,
                createdAt: 1,
                user: '$replyUserInfo',
                parentId: 1
              }
            }
          ],
          as: 'replies'
        }
      },
      {
        $project: {
          _id: 1,
          text: 1,
          createdAt: 1,
          user: '$userInfo',
          replies: 1,
          videoId: 1
        }
      }
    ];
    
    // Chỉ lấy các bình luận gốc (không có parentId)
    const comments = await db.collection('comments')
      .aggregate([
        {
          $match: { 
            videoId: videoObjectId,
            parentId: { $exists: false }
          }
        },
        ...pipeline.slice(1)
      ])
      .toArray();
      
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments: ' + error.message },
      { status: 500 }
    )
  }
}

// Thêm bình luận mới
export async function POST(request) {
  try {
    const { videoId, userId, text, parentId } = await request.json()

    if (!videoId || !userId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    
    // Chuyển đổi ID sang ObjectId
    let videoObjectId, userObjectId, parentObjectId;
    
    try {
      videoObjectId = new ObjectId(videoId);
      userObjectId = new ObjectId(userId);
      
      if (parentId) {
        parentObjectId = new ObjectId(parentId);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid ID format: ' + error.message },
        { status: 400 }
      );
    }
    
    // Kiểm tra xem video có tồn tại
    const video = await db.collection('videos').findOne({ _id: videoObjectId });
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    // Kiểm tra xem người dùng có tồn tại
    const user = await db.collection('users').findOne({ _id: userObjectId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Nếu là reply, kiểm tra xem comment cha có tồn tại không
    if (parentObjectId) {
      const parentComment = await db.collection('comments').findOne({ _id: parentObjectId });
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }
    
    // Tạo bình luận mới
    const newComment = {
      text,
      videoId: videoObjectId,
      userId: userObjectId,
      createdAt: new Date().toISOString()
    }
    
    // Nếu là reply, thêm parentId
    if (parentObjectId) {
      newComment.parentId = parentObjectId;
    }
    
    const result = await db.collection('comments').insertOne(newComment);
    
    // Cập nhật số lượng bình luận của video
    await db.collection('videos').updateOne(
      { _id: videoObjectId },
      { $inc: { comments: 1 } }
    );
    
    // Lấy thông tin người dùng để trả về
    const commentWithUser = {
      ...newComment,
      _id: result.insertedId,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      }
    }
    
    return NextResponse.json(commentWithUser)
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment: ' + error.message },
      { status: 500 }
    )
  }
}