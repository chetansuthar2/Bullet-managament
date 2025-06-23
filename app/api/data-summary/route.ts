import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATA SUMMARY REQUEST ===');
    
    const db = await getDatabase();
    
    // Get all repair entries
    const repairEntries = await db.collection('repairEntries').find({}).toArray();
    
    // Get all images
    const images = await db.collection('images.files').find({}).toArray();
    
    // Get database stats
    const stats = await db.stats();
    
    // Calculate total data size
    const totalImageSize = images.reduce((total, img) => total + (img.length || 0), 0);
    
    // Group entries by status
    const entriesByStatus = {
      pending: repairEntries.filter(entry => entry.status === 'pending').length,
      delivered: repairEntries.filter(entry => entry.status === 'delivered').length,
      total: repairEntries.length
    };
    
    // Get recent entries (last 5)
    const recentEntries = repairEntries
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 5)
      .map(entry => ({
        id: entry._id,
        customerName: entry.customerName,
        bikeType: entry.bikeType,
        status: entry.status,
        entryDate: entry.entryDate,
        hasImage: !!entry.imageUrl
      }));
    
    // Get recent images (last 5)
    const recentImages = images
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5)
      .map(img => ({
        id: img._id,
        filename: img.filename,
        size: img.length,
        uploadDate: img.uploadDate,
        contentType: img.metadata?.contentType
      }));
    
    const summary = {
      database: {
        name: 'VehicleRepairDB',
        location: 'Local MongoDB (127.0.0.1:27017)',
        environment: 'Development',
        totalCollections: stats.collections,
        totalDataSize: stats.dataSize,
        totalStorageSize: stats.storageSize
      },
      repairEntries: {
        total: repairEntries.length,
        pending: entriesByStatus.pending,
        delivered: entriesByStatus.delivered,
        recentEntries: recentEntries
      },
      images: {
        total: images.length,
        totalSize: totalImageSize,
        totalSizeMB: (totalImageSize / (1024 * 1024)).toFixed(2),
        recentImages: recentImages
      },
      storage: {
        type: 'MongoDB GridFS',
        location: 'Local Computer',
        persistent: true,
        backupRecommended: true
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Data summary generated successfully');
    return NextResponse.json(summary, { 
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
    
  } catch (error) {
    console.error('Error generating data summary:', error);
    return NextResponse.json({
      error: 'Failed to generate data summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
