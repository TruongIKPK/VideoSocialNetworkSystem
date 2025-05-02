import { NextResponse } from 'next/server';
import { connectDB } from '../mongodb/route';
import { ObjectId } from 'mongodb';

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
        // Handle base64 image data
        const formData = new FormData();
        const base64Data = data.avatar.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: 'image/png' });
        formData.append('file', blob);
        formData.append('upload_preset', 'looply_avatars');

        console.log('Uploading to Cloudinary...');
        const response = await fetch(`https://api.cloudinary.com/v1_1/dcnmynqty/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Cloudinary upload error:', errorData);
          throw new Error(`Cloudinary upload failed: ${errorData.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Cloudinary upload result:', result);
        avatarUrl = result.secure_url;
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
          avatar: avatarUrl,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      avatar: avatarUrl,
      name: data.name,
      bio: data.bio
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 