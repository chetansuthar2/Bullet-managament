import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    
    // Test database connection
    const db = await getDatabase();
    
    // Test basic operations
    const testCollection = db.collection('connectionTest');
    
    // Insert test document
    const testDoc = {
      timestamp: new Date(),
      message: 'Database connection test successful',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        vercel: !!process.env.VERCEL,
        netlify: !!process.env.NETLIFY,
        isProduction: process.env.NODE_ENV === 'production'
      }
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('Test document inserted:', insertResult.insertedId);
    
    // Read test document
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('Test document read:', readResult);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('Test document cleaned up');
    
    // Get database stats
    const stats = await db.stats();
    
    const response = {
      success: true,
      message: 'Database connection successful',
      environment: process.env.NODE_ENV || 'development',
      deployment: testDoc.deployment,
      database: {
        name: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Database test completed successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        vercel: !!process.env.VERCEL,
        netlify: !!process.env.NETLIFY,
        isProduction: process.env.NODE_ENV === 'production'
      },
      troubleshooting: {
        message: 'Database connection failed',
        possibleCauses: [
          'MongoDB URI not set or incorrect',
          'Network connectivity issues',
          'Database authentication failed',
          'Database server not accessible'
        ],
        solutions: [
          'Check MONGODB_URI or MONGODB_ATLAS_URI environment variable',
          'Verify MongoDB Atlas network access settings',
          'Confirm database user credentials',
          'Check deployment platform environment variables'
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
