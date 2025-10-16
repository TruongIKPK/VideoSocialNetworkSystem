import { NextResponse } from 'next/server'
import { connectDB } from '../../mongodb/route'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { followerId, userId } = await request.json()

    if (!followerId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Không thể tự follow chính mình
    if (followerId === userId) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    
    // Chuyển đổi ID sang ObjectId
    let followerObjectId, userObjectId;
    try {
      // Kiểm tra xem ID có phải là ObjectId string hay không
      if (typeof followerId === 'string') {
        // Xử lý trường hợp ID có định dạng $oid
        if (followerId.includes('$oid')) {
          try {
            const parsed = JSON.parse(followerId);
            followerObjectId = new ObjectId(parsed.$oid);
          } catch (e) {
            followerObjectId = new ObjectId(followerId);
          }
        } else {
          followerObjectId = new ObjectId(followerId);
        }
      } else if (followerId && followerId.$oid) {
        followerObjectId = new ObjectId(followerId.$oid);
      } else {
        followerObjectId = followerId;
      }
      
      // Tương tự cho userId
      if (typeof userId === 'string') {
        if (userId.includes('$oid')) {
          try {
            const parsed = JSON.parse(userId);
            userObjectId = new ObjectId(parsed.$oid);
          } catch (e) {
            userObjectId = new ObjectId(userId);
          }
        } else {
          userObjectId = new ObjectId(userId);
        }
      } else if (userId && userId.$oid) {
        userObjectId = new ObjectId(userId.$oid);
      } else {
        userObjectId = userId;
      }
      
      console.log('Converted IDs:', { followerObjectId, userObjectId });
    } catch (error) {
      console.error('Invalid ID format:', error);
      return NextResponse.json(
        { error: 'Invalid ID format: ' + error.message },
        { status: 400 }
      );
    }
    
    // Kiểm tra xem người dùng có tồn tại không
    const userToFollow = await db.collection('users').findOne(
      { _id: userObjectId }
    );
    const follower = await db.collection('users').findOne(
      { _id: followerObjectId }
    );
    
    if (!userToFollow || !follower) {
      console.error('User not found:', { 
        userToFollowFound: !!userToFollow, 
        followerFound: !!follower, 
        userToFollowId: userObjectId,
        followerId: followerObjectId 
      });
      
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      )
    }

    // Kiểm tra xem đã follow chưa
    if (!follower.following) follower.following = 0;
    if (!follower.followingList) follower.followingList = [];
    if (!userToFollow.followers) userToFollow.followers = 0;
    if (!userToFollow.followersList) userToFollow.followersList = [];
    
    // Kiểm tra xem người dùng đã theo dõi chưa bằng cách so sánh các ID
    const isFollowing = follower.followingList.some(id => {
      if (id instanceof ObjectId) {
        return id.toString() === userObjectId.toString();
      } else if (typeof id === 'object' && id.$oid) {
        return id.$oid === userObjectId.toString();
      }
      return id === userObjectId.toString();
    });
    
    let updateFollower, updateUser;
    
    if (isFollowing) {
      // Nếu đã follow thì hủy follow
      updateFollower = {
        $pull: { followingList: userObjectId },
        $inc: { following: -1 }
      };
      
      updateUser = {
        $pull: { followersList: followerObjectId },
        $inc: { followers: -1 }
      };
    } else {
      // Nếu chưa follow thì follow
      updateFollower = {
        $addToSet: { followingList: userObjectId },
        $inc: { following: 1 }
      };
      
      updateUser = {
        $addToSet: { followersList: followerObjectId },
        $inc: { followers: 1 }
      };
    }

    // Cập nhật thông tin của cả hai người dùng
    await Promise.all([
      db.collection('users').updateOne(
        { _id: followerObjectId },
        updateFollower
      ),
      db.collection('users').updateOne(
        { _id: userObjectId },
        updateUser
      )
    ]);
    
    // Lấy thông tin cập nhật để trả về
    const updatedFollower = await db.collection('users').findOne(
      { _id: followerObjectId },
      { projection: { following: 1, followingList: 1 }}
    );
    
    const updatedUser = await db.collection('users').findOne(
      { _id: userObjectId },
      { projection: { followers: 1, followersList: 1 }}
    );
    
    // Kiểm tra lại trạng thái follow sau khi cập nhật
    const newIsFollowing = updatedFollower.followingList.some(id => {
      if (id instanceof ObjectId) {
        return id.toString() === userObjectId.toString();
      } else if (typeof id === 'object' && id.$oid) {
        return id.$oid === userObjectId.toString();
      }
      return id === userObjectId.toString();
    });
    
    return NextResponse.json({
      success: true,
      isFollowing: newIsFollowing,
      followingCount: updatedFollower.following || 0,
      followersCount: updatedUser.followers || 0
    });
    
  } catch (error) {
    console.error('Error updating follow status:', error);
    return NextResponse.json(
      { error: 'Failed to update follow status: ' + error.message },
      { status: 500 }
    );
  }
}