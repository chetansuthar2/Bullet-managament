import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToMongoDB } from '@/lib/mongoImageStorage';

export async function POST(request: NextRequest) {
  try {
    console.log('=== IMAGE UPLOAD API CALLED ===');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const entryId = formData.get('entryId') as string;

    console.log('Upload request details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId,
      entryId
    });

    if (!file) {
      console.log('Error: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      console.log('Error: No user ID provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Please select a valid image file (JPEG, PNG, or WebP)' 
      }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Image size must be less than 5MB' 
      }, { status: 400 });
    }

    console.log('Attempting to upload image to MongoDB...');
    const result = await uploadImageToMongoDB(file, userId, entryId);
    console.log('Image uploaded successfully:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({
      error: 'Failed to upload image'
    }, { status: 500 });
  }
}
