import { NextResponse } from 'next/server';
import { connectDB } from '../mongodb/route';
import { ObjectId } from 'mongodb';
import cloudinary from '@/lib/cloudinary';

export async function PUT(request) {
  try {
    const data = await request.json();
    console.log('Received profile update data:', data);

    const db = await connectDB();
    
    // Convert string _id to ObjectId
    const userId = new ObjectId(data._id);
    
    // Handle avatar upload if a new file is provided
    let avatarUrl = data.avatar;

    if (data.avatar && typeof data.avatar === 'string' && data.avatar.startsWith('data:')) {
      try {
        // Convert base64 to buffer
        const base64Data = data.avatar.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'avatars',
              format: 'jpg',
              transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          ).end(buffer);
        });

        avatarUrl = result.secure_url;
        console.log('Avatar uploaded successfully:', avatarUrl);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        // If upload fails, keep the existing avatar URL
        avatarUrl = data.avatar;
      }
    }

    // Update user profile in MongoDB
    const result = await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          name: data.name,
          bio: data.bio,
          avatar: avatarUrl || '/no_avatar.png', // Ensure avatar has a default value
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      avatar: avatarUrl || '/no_avatar.png', // Ensure avatar has a default value
      name: data.name,
      bio: data.bio
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 