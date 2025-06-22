import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get all repair entries
    const repairEntries = await db.collection('repairEntries').find({}).toArray();
    
    // Get all images
    const images = await db.collection('images.files').find({}).toArray();
    
    const result = {
      repairEntries: repairEntries.map(entry => ({
        id: entry._id,
        customerName: entry.customerName,
        imageUrl: entry.imageUrl,
        hasImage: !!entry.imageUrl
      })),
      images: images.map(img => ({
        id: img._id,
        filename: img.filename,
        uploadDate: img.uploadDate,
        metadata: img.metadata
      })),
      summary: {
        totalRepairEntries: repairEntries.length,
        entriesWithImages: repairEntries.filter(e => e.imageUrl).length,
        totalImages: images.length
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in debug-images:', error);
    return NextResponse.json({ error: 'Failed to get debug info' }, { status: 500 });
  }
}
