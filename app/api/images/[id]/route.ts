import { NextRequest, NextResponse } from 'next/server';
import { getImageFromMongoDB, deleteImageFromMongoDB } from '@/lib/mongoImageStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;

    if (!imageId) {
      return new NextResponse('Image ID is required', { status: 400 });
    }

    const imageData = await getImageFromMongoDB(imageId);

    if (!imageData) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const { stream, metadata } = imageData;

    // Convert stream to buffer
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);

        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': metadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });

        resolve(response);
      });

      stream.on('error', () => {
        resolve(new NextResponse('Error reading image', { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// DELETE - Delete image from MongoDB
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;

    if (!imageId) {
      return new NextResponse('Image ID is required', { status: 400 });
    }

    console.log('Deleting image from MongoDB:', imageId);
    await deleteImageFromMongoDB(imageId);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return new NextResponse('Failed to delete image', { status: 500 });
  }
}
