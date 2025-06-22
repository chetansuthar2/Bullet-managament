import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    console.log('=== STARTING IMAGE CLEANUP ===');
    
    // Get all repair entries with image URLs
    const repairEntries = await db.collection('repairEntries').find({
      imageUrl: { $exists: true, $ne: null, $ne: "" }
    }).toArray();
    
    console.log(`Found ${repairEntries.length} repair entries with image URLs`);
    
    // Get all valid image IDs from GridFS
    const validImages = await db.collection('images.files').find({}).toArray();
    const validImageIds = new Set(validImages.map(img => img._id.toString()));
    
    console.log(`Found ${validImages.length} valid images in database`);
    
    let cleanedCount = 0;
    
    // Check each repair entry's image URL
    for (const entry of repairEntries) {
      if (entry.imageUrl) {
        // Extract image ID from URL (format: /api/images/[id])
        const imageIdMatch = entry.imageUrl.match(/\/api\/images\/([a-f0-9]{24})/);
        
        if (imageIdMatch) {
          const imageId = imageIdMatch[1];
          
          // Check if this image ID exists in the database
          if (!validImageIds.has(imageId)) {
            console.log(`Cleaning invalid image URL from entry ${entry._id}: ${entry.imageUrl}`);
            
            // Remove the invalid image URL
            await db.collection('repairEntries').updateOne(
              { _id: entry._id },
              { $unset: { imageUrl: "" } }
            );
            
            cleanedCount++;
          }
        } else {
          console.log(`Invalid image URL format in entry ${entry._id}: ${entry.imageUrl}`);
          
          // Remove malformed image URL
          await db.collection('repairEntries').updateOne(
            { _id: entry._id },
            { $unset: { imageUrl: "" } }
          );
          
          cleanedCount++;
        }
      }
    }
    
    console.log(`=== CLEANUP COMPLETE: Cleaned ${cleanedCount} invalid image references ===`);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} invalid image references`,
      totalEntriesChecked: repairEntries.length,
      validImagesFound: validImages.length,
      cleanedCount
    });
    
  } catch (error) {
    console.error('Error in image cleanup:', error);
    return NextResponse.json({ error: 'Failed to cleanup images' }, { status: 500 });
  }
}
